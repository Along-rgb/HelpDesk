/**
 * Temporary local upload for category icons (demo).
 * Saves to public/uploads/ so images are served at /uploads/filename (same-origin, no proxy).
 *
 * Security: Requires JWT + admin role. SVG rejected. File type verified by magic bytes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { jwtVerify } from 'jose';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

/** SVG is NOT allowed — it can contain inline scripts (Stored XSS) */
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const MAX_FILE_BYTES = parseInt(process.env.LOCAL_CATEGORY_ICON_MAX_BYTES || '1048576', 10); // 1 MB default

const JWT_SECRET = process.env.JWT_SECRET?.trim() || process.env.HELPDESK_JWT_SECRET?.trim();

/** Admin roleIds that are allowed to upload */
const ADMIN_ROLES = [1, 2]; // SuperAdmin, Admin

/* ── Magic-byte verification ── */
const MAGIC_BYTES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
];

function detectImageType(buf: Uint8Array): string | null {
  for (const { mime, bytes } of MAGIC_BYTES) {
    if (bytes.every((b, i) => buf[i] === b)) return mime;
  }
  return null;
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

async function verifyJwtAndRole(
  request: NextRequest
): Promise<{ userId: number; roleId: number } | { error: NextResponse }> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const token = auth.slice(7).trim();
  if (!token || !JWT_SECRET) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.sub ?? payload.userId ?? payload.id);
    const roleId = Number(payload.roleId ?? payload.role ?? 0);
    if (Number.isNaN(userId) || userId < 1) {
      return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
    }
    if (!ADMIN_ROLES.includes(roleId)) {
      return { error: NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 }) };
    }
    return { userId, roleId };
  } catch {
    return { error: NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 }) };
  }
}

export async function POST(request: NextRequest) {
  /* ── Auth check ── */
  const authResult = await verifyJwtAndRole(request);
  if ('error' in authResult) return authResult.error;

  const formData = await request.formData();
  const file = formData.get('catIcon') as File | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  /* ── Size check ── */
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_FILE_BYTES} bytes)` }, { status: 400 });
  }

  /* ── Reject SVG by MIME or extension ── */
  const lowerName = file.name.toLowerCase();
  if (file.type.includes('svg') || lowerName.endsWith('.svg') || lowerName.endsWith('.svgz')) {
    return NextResponse.json({ error: 'SVG files are not allowed' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buf = new Uint8Array(bytes);

  /* ── Magic-byte detection (don't trust client MIME) ── */
  const detectedMime = detectImageType(buf);
  if (!detectedMime || !ALLOWED_TYPES.includes(detectedMime)) {
    return NextResponse.json({ error: 'File content does not match an allowed image type' }, { status: 400 });
  }

  const ext = MIME_TO_EXT[detectedMime] || 'png';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const buffer = Buffer.from(bytes);
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ catIcon: filename });
}
