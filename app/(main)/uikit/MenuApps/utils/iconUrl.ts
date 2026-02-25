/**
 * สร้าง URL เต็มสำหรับรูป category icon ที่ API คืนเป็นแค่ชื่อไฟล์ (เช่น 1771872669381-184173377.png)
 * URL = {API_BASE}/helpdesk/uploads/{filename}
 * - ใช้ env.helpdeskUploadBaseUrl (หรือ derive จาก helpdeskApiUrl ถ้าไม่ตั้ง)
 */
import { env } from '@/config/env';

export function getCategoryIconFullUrl(filenameOrUrl: string): string {
  if (!filenameOrUrl || typeof filenameOrUrl !== 'string') return '';
  const s = filenameOrUrl.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const base = (env.helpdeskUploadBaseUrl ?? '').trim().replace(/\/$/, '');
  if (!base) return s;
  const filename = s.replace(/^\//, '');
  return `${base}/${filename}`;
}

/** Base URL ที่ใช้สร้าง icon URL (สำหรับ debug เท่านั้น) */
export function getCategoryIconBaseUrl(): string {
  return (env.helpdeskUploadBaseUrl ?? '').trim().replace(/\/$/, '') || '';
}

/**
 * URL สำหรับแสดงรูปผ่าน Next.js proxy (same-origin) — แก้ CORS เมื่อโหลดจากอีก domain
 * - ชื่อไฟล์เท่านั้น → /api/proxy-category-icon?file=<filename>
 * - full URL → /api/proxy-category-icon?file=<encoded-url> (proxy จะ fetch ให้)
 */
export function getCategoryIconProxyUrl(filenameOrUrl: string): string {
  if (!filenameOrUrl || typeof filenameOrUrl !== 'string') return '';
  const s = filenameOrUrl.trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return `/api/proxy-category-icon?file=${encodeURIComponent(s)}`;
  }
  const file = s.replace(/^\//, '');
  if (!file) return '';
  return `/api/proxy-category-icon?file=${encodeURIComponent(file)}`;
}

/** Alias for getCategoryIconProxyUrl — proxy URL for display */
export function getCategoryIconUrl(filename: string): string {
  return getCategoryIconProxyUrl(filename);
}

/**
 * Demo: URL for icons stored in public/uploads/ (same-origin, no proxy).
 * Use when NEXT_PUBLIC_USE_LOCAL_CATEGORY_ICON_UPLOAD=true and the file was uploaded via /api/upload-category-icon.
 */
export function getLocalUploadIconUrl(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const s = filename.trim().replace(/^\//, '');
  return s ? `/uploads/${s}` : '';
}
