/**
 * Build URL for the download proxy API. Use this instead of linking directly to the
 * external/Helpdesk URL to avoid 404 and CORS issues — the server fetches the file and streams it.
 *
 * - originalUrl: full URL (https://...) or same-origin path (e.g. /api/proxy-helpdesk/upload/hdFile/x.pdf).
 * - fileName: suggested filename for the download.
 * - disposition: "attachment" (default) to force download; "inline" to display (e.g. for <img src>).
 */
export function getDownloadApiUrl(
  originalUrl: string,
  fileName: string,
  disposition: "attachment" | "inline" = "attachment"
): string {
  if (!originalUrl || typeof originalUrl !== "string" || !originalUrl.trim()) {
    return "";
  }
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({
    fileUrl: originalUrl.trim(),
    fileName: fileName?.trim() || "file",
  });
  if (disposition === "inline") {
    params.set("disposition", "inline");
  }
  const path = `/api/download?${params.toString()}`;
  return base ? `${base}${path}` : path;
}

/**
 * Open the download in the current window (or use as href for a link). Prefer using
 * getDownloadApiUrl as href for <a download> so the proxy handles the file and sets
 * Content-Disposition: attachment.
 */
export function downloadFile(originalUrl: string, fileName: string): void {
  const url = getDownloadApiUrl(originalUrl, fileName, "attachment");
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
