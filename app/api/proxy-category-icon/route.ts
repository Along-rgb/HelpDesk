/**
 * Proxy for category icon images — avoids CORS when frontend (e.g. localhost:3500)
 * loads images from another domain (e.g. api-test.edl.com.la/helpdesk/upload/categoryicon).
 * Uses env.helpdeskUploadBaseUrl (from NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL or derived from API base).
 * On remote 404, tries public/uploads/{filename} so local uploads still work when UI uses proxy URL.
 *
 * Security: Absolute URLs are only allowed from trusted origins.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { env } from '@/config/env';

function getUploadBaseUrl(): string {
  return env.helpdeskUploadBaseUrl;
}

/* ── Trusted-origin allowlist for icon proxy ── */
function getTrustedIconOrigins(): string[] {
  const origins = new Set<string>();
  const explicit = process.env.SECURITY_ALLOWED_ICON_PROXY_ORIGINS?.trim();
  if (explicit) {
    explicit.split(",").forEach((o) => {
      try { origins.add(new URL(o.trim()).origin); } catch { /* skip */ }
    });
  }
  const envKeys = [
    process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL,
    process.env.NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL,
    process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME,
  ];
  for (const raw of envKeys) {
    const v = raw?.trim();
    if (!v) continue;
    try {
      const url = v.startsWith("http") ? v : `https://${v}`;
      origins.add(new URL(url).origin);
    } catch { /* skip */ }
  }
  return Array.from(origins);
}

let _trustedIconOrigins: string[] | null = null;
function cachedTrustedIconOrigins(): string[] {
  if (!_trustedIconOrigins) _trustedIconOrigins = getTrustedIconOrigins();
  return _trustedIconOrigins;
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

/** If file param is a full URL, validate its origin then use it; otherwise require base + filename (ใช้แค่ชื่อไฟล์เพื่อไม่ซ้ำ path กับ base) */
function resolveImageUrl(file: string, base: string): string | null {
  const s = file.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    /* ── SECURITY: Only allow absolute URLs from trusted origins ── */
    try {
      const parsed = new URL(s);
      const trusted = cachedTrustedIconOrigins();
      if (!trusted.some((o) => o.toLowerCase() === parsed.origin.toLowerCase())) {
        return null; // untrusted origin → reject
      }
      return s;
    } catch {
      return null;
    }
  }
  const name = safeFilename(s);
  if (!name || !base) return null;
  const filenameOnly = toSimpleFilename(name);
  return `${base}/${filenameOnly}`;
}

/** Security response headers for proxied images */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  'X-Frame-Options': 'DENY',
};

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get('file');
  const base = getUploadBaseUrl();

  if (!file || typeof file !== 'string' || !file.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid file parameter' },
      { status: 400 }
    );
  }

  const url = resolveImageUrl(file, base);

  if (!url) {
    return NextResponse.json(
      { error: 'Invalid file (path not allowed or origin not trusted)' },
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
          ...SECURITY_HEADERS,
        },
      });
    }

    if (res.status === 404 && isSimpleFilename) {
      const filenameOnly = toSimpleFilename(name);
      const subdomain = base.replace(/\/upload\/categoryicon\/?$/i, '');
      const fallbackUrl = subdomain ? `${subdomain}/uploads/${filenameOnly}` : '';
      if (fallbackUrl) {
        /* Validate fallback URL is also under a trusted origin */
        try {
          const fallbackParsed = new URL(fallbackUrl);
          const trusted = cachedTrustedIconOrigins();
          const fallbackTrusted = trusted.some((o) => o.toLowerCase() === fallbackParsed.origin.toLowerCase());
          if (fallbackTrusted) {
            try {
              const resFallback = await fetch(fallbackUrl, { cache: 'no-store' });
              if (resFallback.ok) {
                let contentType = resFallback.headers.get('content-type') || 'image/svg+xml';
                if (contentType.includes(';')) contentType = contentType.split(';')[0].trim();
                const body = await resFallback.arrayBuffer();
                return new NextResponse(body, {
                  status: 200,
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600',
                    ...SECURITY_HEADERS,
                  },
                });
              }
            } catch {
              // ignore, continue to local fallback
            }
          }
        } catch {
          // invalid fallback URL, skip
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
            ...SECURITY_HEADERS,
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
      console.error('[proxy-icon] Proxy fetch failed:', message);
    }
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 });
  }
}
