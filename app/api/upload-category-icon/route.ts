/**
 * Temporary local upload for category icons (demo).
 * Saves to public/uploads/ so images are served at /uploads/filename (same-origin, no proxy).
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

function safeExt(name: string): string {
  const match = name.match(/\.(png|jpeg|jpg|gif|webp|svg)$/i);
  return match ? match[1].toLowerCase() : 'png';
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('catIcon') as File | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const ext = safeExt(file.name);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ catIcon: filename });
}
