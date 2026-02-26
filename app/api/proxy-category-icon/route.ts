/**
 * Proxy for category icon images — avoids CORS when frontend (e.g. localhost:3500)
 * loads images from another domain (e.g. api-test.edl.com.la/helpdesk/upload/categoryicon).
 * Reads upload base from NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL (or derived from API base).
 * On remote 404, tries public/uploads/{filename} so local uploads still work when UI uses proxy URL.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/** Base path ตาม Backend: subdomain/upload/categoryicon (ไม่มี s ท้าย categoryicon) */
const UPLOAD_CATEGORYICON_PATH = '/upload/categoryicon';

function getUploadBaseUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;
  const apiBase = (process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL ?? '').trim();
  if (!apiBase) return '';
  const subdomain = apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  return subdomain + UPLOAD_CATEGORYICON_PATH;
}

/** ถ้า Backend ส่ง path ย่อย (เช่น categoryicon/xxx.png) ใช้แค่ชื่อไฟล์เพื่อไม่ให้ path ซ้ำกับ base */
function toSimpleFilename(file: string): string {
  const s = file.trim().replace(/^\//, '');
  const segments = s.split('/').filter(Boolean);
  return segments.length > 1 ? segments[segments.length - 1]! : s;
}

/**
 * อนุญาตชื่อไฟล์ Category Icon ทั่วไป: xxx.png, 123-456.png, subfolder/icon.svg
 * ป้องกัน Path Traversal เท่านั้น: กัน .. และ backslash และ null — ไม่บล็อกตัวอักษร/ตัวเลข/ขีด/จุด
 */
function safeFilename(file: string): string | null {
  const s = file.trim().replace(/^\//, '');
  if (!s || s.length > 512) return null;
  if (s.includes('..') || /\\/.test(s) || /\0/.test(s)) return null;
  const segments = s.split('/').filter(Boolean);
  if (segments.some((seg) => seg === '..' || seg.length > 255)) return null;
  return segments.join('/');
}

/** If file param is a full URL, use it; otherwise require base + filename (ใช้แค่ชื่อไฟล์เพื่อไม่ซ้ำ path กับ base) */
function resolveImageUrl(file: string, base: string): string | null {
  const s = file.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const name = safeFilename(s);
  if (!name || !base) return null;
  const filenameOnly = toSimpleFilename(name);
  return `${base}/${filenameOnly}`;
}

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file');
  const base = getUploadBaseUrl();

  if (process.env.NODE_ENV === 'development') {
    console.log('[proxy-icon] file:', file ?? '(missing)', '| base:', base || '(empty — set NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL)');
  }

  if (!file || typeof file !== 'string' || !file.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid file parameter' },
      { status: 400 }
    );
  }

  const url = resolveImageUrl(file, base);
  if (process.env.NODE_ENV === 'development') {
    console.log('[proxy-icon] url (resolveImageUrl):', url ?? '(null)');
  }

  if (!url) {
    return NextResponse.json(
      { error: 'Invalid file (path not allowed) or NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL is not configured' },
      { status: 400 }
    );
  }

  const name = safeFilename(file.trim().replace(/^\//, ''));
  const isSimpleFilename = name && !name.includes('/');

  if (process.env.NODE_ENV === 'development') {
    console.log('[proxy-icon] Final Proxy URL:', url);
  }

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

    if (process.env.NODE_ENV === 'development') {
      console.error('[proxy-icon] Fetch not OK — status:', res.status, '| url:', url);
    }

    if (res.status === 404 && isSimpleFilename) {
      const filenameOnly = toSimpleFilename(name);
      const subdomain = base.replace(/\/upload\/categoryicon\/?$/i, '');
      const fallbackUrl = subdomain ? `${subdomain}/uploads/${filenameOnly}` : '';
      if (fallbackUrl) {
        try {
          const resFallback = await fetch(fallbackUrl, { cache: 'no-store' });
          if (resFallback.ok) {
            if (process.env.NODE_ENV === 'development') {
              console.log('[proxy-icon] Served from fallback URL:', fallbackUrl);
            }
            let contentType = resFallback.headers.get('content-type') || 'image/svg+xml';
            if (contentType.includes(';')) contentType = contentType.split(';')[0].trim();
            const body = await resFallback.arrayBuffer();
            return new NextResponse(body, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600',
              },
            });
          }
        } catch {
          // ignore, continue to local fallback
        }
      }

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
    const payload: { error: string; attemptedUrl?: string } = { error: 'Image not found' };
    if (process.env.NODE_ENV === 'development') payload.attemptedUrl = url;
    return NextResponse.json(payload, { status: 404 });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      const message = err instanceof Error ? err.message : String(err);
      const name = err instanceof Error ? err.name : 'Error';
      console.error('[proxy-icon] Proxy fetch failed — url:', url, '| error:', name, message);
      if (err instanceof Error && err.cause) {
        console.error('[proxy-icon] cause:', err.cause);
      }
    }
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 });
  }
}
