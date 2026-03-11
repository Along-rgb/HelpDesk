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
    disposition: disposition,
  });
  const path = `/api/download?${params.toString()}`;
  return base ? `${base}${path}` : path;
}

/**
 * Trigger download via hidden anchor (avoids window.open being blocked by the browser).
 * Builds proxy URL with getDownloadApiUrl and programmatically clicks a temporary <a download>.
 */
export function downloadFile(originalUrl: string, fileName: string): void {
  try {
    const url = getDownloadApiUrl(originalUrl, fileName, "attachment");
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName ?? "download";
    link.setAttribute("rel", "noopener noreferrer");
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    // Silent fail; avoid logging sensitive data
  }
}
