/**
 * Proxy download route: fetches a file from an external URL (or same-origin proxy) and returns it.
 * Uses token from cookies (Server-side) and sends Authorization: Bearer <token> so Backend allows access.
 *
 * Query:
 * - fileUrl (required): full URL to the file (absolute or relative; relative is resolved against request origin).
 * - fileName (optional): suggested filename for download.
 * - disposition (optional): "inline" to display in browser (e.g. images); default "attachment" for download.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const ALLOWED_PROTOCOLS = ["https:", "http:"];

function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return ext ? map[ext] ?? "application/octet-stream" : "application/octet-stream";
}

function safeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]/g, "_").slice(0, 255) || "download";
}

/**
 * Resolve fileUrl to an absolute URL for fetch().
 * - If fileUrl already has a domain (http/https), use as-is.
 * - If fileUrl is a path (e.g. /helpdesk/upload/hdFile/x.pdf), prefix with External API host
 *   so we fetch from the real Backend, not from local disk. Do NOT remove /helpdesk from path.
 * - Uses NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME or origin from NEXT_PUBLIC_HELPDESK_API_BASE_URL.
 */
function resolveFetchUrl(fileUrl: string, requestOrigin: string): string {
  const trimmed = fileUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path.startsWith("/api/")) {
    return `${requestOrigin.replace(/\/$/, "")}${path}`;
  }
  const imageHost = process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME?.trim();
  const apiBase = process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL?.trim();
  let base: string;
  if (imageHost) {
    base = imageHost.startsWith("http") ? imageHost.replace(/\/+$/, "") : `https://${imageHost.replace(/^https?:\/\//, "")}`;
  } else if (apiBase) {
    try {
      base = new URL(apiBase).origin;
    } catch {
      base = requestOrigin.replace(/\/$/, "");
    }
  } else {
    base = requestOrigin.replace(/\/$/, "");
  }
  return `${base}${path}`;
}

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get("fileUrl");
  const fileNameParam = request.nextUrl.searchParams.get("fileName");
  const disposition = request.nextUrl.searchParams.get("disposition")?.toLowerCase() === "inline" ? "inline" : "attachment";

  if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid fileUrl parameter" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ??
    cookieStore.get("accessToken")?.value ??
    cookieStore.get("auth")?.value ??
    cookieStore.get("session")?.value;

  const requestOrigin = request.nextUrl.origin;
  const fetchUrl = resolveFetchUrl(fileUrl.trim(), requestOrigin);

  let url: URL;
  try {
    url = new URL(fetchUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid fileUrl (could not resolve URL)" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return NextResponse.json(
      { error: "Only http and https URLs are allowed" },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const fileName = fileNameParam?.trim()
    ? safeFileName(fileNameParam.trim())
    : safeFileName(url.pathname.split("/").pop() || "download");

  const headers: HeadersInit = { Accept: "*/*" };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(fetchUrl, {
      cache: "no-store",
      headers,
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "File not found (404)", message: "The requested file was not found on the server." },
        { status: 404, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "File fetch failed", message: "The server could not return the file." },
        { status: res.status >= 500 ? 502 : res.status, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const contentType =
      res.headers.get("content-type")?.split(";")[0]?.trim() ||
      getContentTypeFromFilename(fileName);
    const body = await res.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${fileName.replace(/"/g, "%22")}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": disposition === "inline" ? "public, max-age=3600" : "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Download failed" },
      { status: 502, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
