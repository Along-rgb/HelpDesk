/**
 * สร้าง URL เต็มสำหรับรูป category icon ที่ API คืนเป็นแค่ชื่อไฟล์ (เช่น 1771872669381-184173377.png)
 * ใช้ตามหลัก React/Next.js: แยก logic สร้าง URL ออกจาก component
 */
import { env } from '@/config/env';

export function getCategoryIconFullUrl(filenameOrUrl: string): string {
  if (!filenameOrUrl || typeof filenameOrUrl !== 'string') return '';
  const s = filenameOrUrl.trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const base = (env.helpdeskUploadBaseUrl ?? '').replace(/\/$/, '');
  if (!base) return s;
  return `${base}/${s.replace(/^\//, '')}`;
}
