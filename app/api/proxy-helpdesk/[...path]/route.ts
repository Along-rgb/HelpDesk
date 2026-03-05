/**
 * Proxy for Helpdesk API — ใช้เมื่อ backend ไม่ส่ง CORS headers
 * เปิดใช้ด้วย NEXT_PUBLIC_USE_HELPDESK_PROXY=true ใน .env.local
 */
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';

function getBackendBaseUrl(): string {
  return env.helpdeskApiUrl.trim().replace(/\/$/, '');
}

/** Base for upload endpoints: .../helpdesk/upload (hdfile, hdimage) */
function getUploadBaseUrl(): string {
  return env.helpdeskUploadRequestBaseUrl;
}

async function proxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
): Promise<NextResponse> {
  const path = pathSegments.filter(Boolean).join('/');
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const isUpload = path.startsWith('upload/');
  const base = isUpload ? getUploadBaseUrl() : getBackendBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: 'Proxy not configured. Set NEXT_PUBLIC_HELPDESK_API_BASE_URL in .env.local and restart dev server' },
      { status: 503 }
    );
  }
  const targetPath = isUpload ? path.slice(7) : path; // upload/hdFile → hdFile
  const url = new URL(request.url);
  const targetUrl = `${base}/${targetPath}${url.search}`;

  const headers = new Headers();
  const auth = request.headers.get('Authorization');
  if (auth) headers.set('Authorization', auth);
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Accept', request.headers.get('Accept') ?? 'application/json');

  let body: string | FormData | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const isForm = contentType?.includes('multipart/form-data');
    if (isForm) {
      const formData = await request.formData();
      const res = await fetch(targetUrl, {
        method,
        headers: auth ? { Authorization: auth } : undefined,
        body: formData,
      });
      const data = await res.arrayBuffer();
      const resContentType = res.headers.get('Content-Type') || 'application/json';
      return new NextResponse(data, {
        status: res.status,
        headers: { 'Content-Type': resContentType },
      });
    }
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: body ?? undefined,
  });

  const resContentType = res.headers.get('Content-Type') || 'application/json';
  const data = await res.arrayBuffer();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': resContentType },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path, 'PATCH');
}
