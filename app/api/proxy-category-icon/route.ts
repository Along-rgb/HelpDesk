/**
 * Proxy for category icon images — avoids CORS when frontend (e.g. localhost:3500)
 * loads images from another domain (e.g. api-test.edl.com.la/helpdesk/uploads).
 * Reads upload base from NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL (or derived from API base).
 */
import { NextRequest, NextResponse } from 'next/server';

function getUploadBaseUrl(): string {
  const explicit = (process.env.NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  const apiBase = (process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL ?? '').trim();
  if (!apiBase) return '';
  return apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads';
}

/** Allow only filename (no path) to prevent path traversal */
function safeFilename(file: string): string | null {
  const s = file.trim().replace(/^\//, '');
  if (!s || /[\/\\]/.test(s)) return null;
  return s;
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

  try {
    const res = await fetch(url, { cache: 'force-cache', next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    const contentType = res.headers.get('content-type') || 'image/png';
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 });
  }
}
