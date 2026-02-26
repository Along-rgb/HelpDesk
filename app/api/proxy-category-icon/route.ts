/**
 * Proxy for category icon images — avoids CORS when frontend (e.g. localhost:3500)
 * loads images from another domain (e.g. api-test.edl.com.la/helpdesk/upload/categoryicons).
 * Reads upload base from NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL (or derived from API base).
 * On remote 404, tries public/uploads/{filename} so local uploads still work when UI uses proxy URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/** Base path สำหรับ category icons บน Backend (ไม่ใช่ /uploads) */
const UPLOAD_CATEGORYICONS_PATH = '/upload/categoryicons';

function getUploadBaseUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  const apiBase = (process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL ?? '').trim();
  if (!apiBase) return '';
  const baseWithoutApi = apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return baseWithoutApi + UPLOAD_CATEGORYICONS_PATH;
}

/**
 * อนุญาต path รูปแบบ filename หรือ subfolder/filename (เช่น subfolder/image.png)
 * ป้องกัน Path Traversal: กัน .. และ backslash
 */
function safeFilename(file: string): string | null {
  const s = file.trim().replace(/^\//, '');
  if (!s) return null;
  if (s.includes('..') || /\\/.test(s) || /\0/.test(s)) return null;
  const segments = s.split('/').filter(Boolean);
  if (segments.some((seg) => seg === '..')) return null;
  return segments.join('/');
}

/** If file param is a full URL, use it; otherwise require base + filename */
function resolveImageUrl(file: string, base: string): string | null {
  const s = file.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const name = safeFilename(s);
  if (!name || !base) return null;
  return `${base}/${name}`;
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file');
  const base = getUploadBaseUrl();

  if (process.env.NODE_ENV === 'development') {
    console.log('[proxy-icon] base:', base || '(empty — set NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL)', '| file:', file ?? '(missing)');
  }

  if (!file || typeof file !== 'string' || !file.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid file parameter' },
      { status: 400 }
    );
  }

  const url = resolveImageUrl(file, base);
  if (!url) {
    return NextResponse.json(
      { error: 'Invalid file (path not allowed) or NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL is not configured' },
      { status: 400 }
    );
  }

  const name = safeFilename(file.trim().replace(/^\//, ''));
  const isSimpleFilename = name && !name.includes('/');

  try {
    const res = await fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } });
    if (res.ok) {
      let contentType = res.headers.get('content-type') || 'image/png';
      if (contentType.includes(';')) contentType = contentType.split(';')[0].trim();
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    if (res.status === 404 && isSimpleFilename) {
      const localPath = join(process.cwd(), 'public', 'uploads', name);
      if (existsSync(localPath)) {
        const body = await readFile(localPath);
        const ext = name.split('.').pop()?.toLowerCase();
        const contentType =
          ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/png';
        return new NextResponse(body, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 });
  }
}
