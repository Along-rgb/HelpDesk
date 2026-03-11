/**
 * Proxy download route: fetches a file from an external URL (or same-origin proxy) and returns it.
 *
 * Query:
 * - fileUrl (required): full URL to the file (absolute or relative; relative is resolved against request origin).
 * - fileName (optional): suggested filename for download.
 * - disposition (optional): "inline" to display in browser (e.g. images); default "attachment" for download.
 */
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

const ALLOWED_PROTOCOLS = ["https:", "http:"];

/** CORS Allow-Origin: ใช้ appUrl จาก env; ถ้าว่างใช้ request origin (same-origin) */
function getCorsOrigin(requestOrigin: string): string {
  const appUrl = env.appUrl?.trim();
  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      return requestOrigin;
    }
  }
  return requestOrigin;
}

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
 * ດຶງ upload base ຈາກ NEXT_PUBLIC_HELPDESK_API_BASE_URL (ຕັດ /api ທ້າຍ) ເພື່ອໃຊ້ໃນ resolveFetchUrl.
 */
function getHelpdeskUploadBase(): string {
  const url = (process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL ?? "").trim();
  if (!url) return "";
  return url.replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

/**
 * Build set of hostnames we are allowed to fetch from (prevent SSRF).
 * Only these hosts are allowed when fileUrl is absolute (http/https).
 */
function getAllowedDownloadHosts(requestOrigin: string): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(requestOrigin).hostname);
  } catch {
    // ignore
  }
  const helpdeskBase = getHelpdeskUploadBase();
  if (helpdeskBase) {
    try {
      hosts.add(new URL(helpdeskBase).hostname);
    } catch {
      // ignore
    }
  }
  const apiBase = (process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL ?? "").trim();
  if (apiBase) {
    try {
      hosts.add(new URL(apiBase).hostname);
    } catch {
      // ignore
    }
  }
  const imageHost = (process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME ?? "").trim();
  if (imageHost) {
    const h = imageHost.replace(/^https?:\/\//, "").split("/")[0];
    if (h) hosts.add(h);
  }
  return hosts;
}

/**
 * Resolve fileUrl to an absolute URL for fetch().
 * - If fileUrl already has a domain (http/https), use as-is.
 * - If fileUrl ເລີ່ມຕົ້ນດ້ວຍ /api/proxy-helpdesk/: ປ່ຽນເປັນ Full Absolute URL ຂອງ Backend จริงໂດຍໃຊ້ apiBase
 *   (ເອົາ path ຫຼັງ /api/proxy-helpdesk ໄປຕໍ່ກັບ apiBase) ເພື່ອໃຫ້ fetch() ໄປດຶງຈາກ Backend จริง.
 * - If fileUrl is path ປະເພດ /upload/... (ບໍ່ມີ /api/): prefix ດ້ວຍ External API host.
 */
function resolveFetchUrl(fileUrl: string, requestOrigin: string): string {
  const trimmed = fileUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // /api/proxy-helpdesk/upload/... → Backend จริง: apiBase + /upload/...
  if (path.startsWith("/api/proxy-helpdesk/")) {
    const apiBase = getHelpdeskUploadBase();
    if (apiBase) {
      const backendPath = path.slice("/api/proxy-helpdesk".length); // ເລີ່ມຈາກ /upload/...
      return `${apiBase}${backendPath}`;
    }
    // ຖ້າບໍ່ມີ env ຕັ້ງ ໃຊ້ same-origin ເປັນ fallback
    return `${requestOrigin.replace(/\/$/, "")}${path}`;
  }

  // /api/ ອື່ນໆ (ບໍ່ແມ່ນ proxy-helpdesk) → same-origin
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

  const requestOrigin = request.nextUrl.origin;
  const allowOrigin = getCorsOrigin(requestOrigin);

  if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid fileUrl parameter" },
      { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  const fetchUrl = resolveFetchUrl(fileUrl.trim(), requestOrigin);

  let url: URL;
  try {
    url = new URL(fetchUrl);
  } catch {
    return NextResponse.json(
      { error: "Invalid fileUrl (could not resolve URL)" },
      { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return NextResponse.json(
      { error: "Only http and https URLs are allowed" },
      { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  const allowedHosts = getAllowedDownloadHosts(requestOrigin);
  if (!allowedHosts.has(url.hostname)) {
    return NextResponse.json(
      { error: "URL not allowed (host not in allowlist)" },
      { status: 403, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  const fileName = fileNameParam?.trim()
    ? safeFileName(fileNameParam.trim())
    : safeFileName(url.pathname.split("/").pop() || "download");

  const headers: HeadersInit = { Accept: "*/*" };

  try {
    const res = await fetch(fetchUrl, {
      cache: "no-store",
      headers,
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "File not found (404)", message: "The requested file was not found on the server." },
        { status: 404, headers: { "Access-Control-Allow-Origin": allowOrigin } }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "File fetch failed",
          message: "The server could not return the file.",
          status: res.status,
        },
        { status: res.status >= 500 ? 502 : res.status, headers: { "Access-Control-Allow-Origin": allowOrigin } }
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
        "Access-Control-Allow-Origin": allowOrigin,
        "Cache-Control": disposition === "inline" ? "public, max-age=3600" : "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Download failed" },
      { status: 502, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }
}
