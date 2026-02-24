/**
 * จุดรวมการอ่าน Environment Variables ทั้งหมด
 * รองรับหลาย Backend โดยแต่ละตัวมี env แยก ชัดเจน และมี default สำหรับ dev
 *
 * ใช้: import { env } from '@/config/env';
 * แล้วใช้ env.helpdeskApiUrl, env.ticketsApiUrl ฯลฯ
 */

const getEnv = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined') {
    // Client: Next.js injects NEXT_PUBLIC_* at build time
    const val = (process.env as Record<string, string | undefined>)[key];
    return (val && val.trim()) || fallback;
  }
  return (process.env[key]?.trim()) || fallback;
};

/** ค่า env ที่ใช้ในแอป (หลาย Backend) — ไม่ใช้ Hardcoded URL; ทุก URL ต้องตั้งใน .env */
export const env = {
  // ----- App / Metadata (ใช้ใน metadataBase, Open Graph) -----
  /** URL ฐานของแอป (ใช้ใน metadata, แชร์ลิงก์) — ต้องตั้ง NEXT_PUBLIC_APP_URL */
  appUrl: getEnv('NEXT_PUBLIC_APP_URL', ''),
  /** URL รูป Open Graph (optional) — ใช้ใน metadata images */
  ogImageUrl: getEnv('NEXT_PUBLIC_OG_IMAGE_URL', ''),

  // ----- HelpDesk API (users, auth, departments, ... ທັງໝົດຢູ່ under /helpdesk/api) -----
  /** baseURL ລວມ /api ແລ້ວ — ບໍ່ໃສ່ /api/ ຊ້ຳໃນ path ອື່ນ */
  helpdeskApiUrl: getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', ''),
  /** Path สำหรับ login (ต่อกับ helpdeskApiUrl, ເຊັ່ນ auth/login → .../helpdesk/api/auth/login) */
  helpdeskAuthLoginPath: getEnv('NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH', 'auth/login'),
  /** Base URL สำหรับรูปที่อัปโหลด (categoryicons ແລະອື່ນ) — ຖ້າວ່າງຈະໃຊ້ helpdeskApiUrl ຕັດ /api ເປັນ /uploads */
  helpdeskUploadBaseUrl: getEnv('NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL', ''),
  /** ถ้า backend ใช้ userName (PascalCase) แทน username ให้ตั้งเป็น 'true' */
  loginUsePascalCase: getEnv('NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE', 'false').toLowerCase() === 'true',

  // ----- Tickets API (สร้าง/ดึง/อัปเดต ticket — ถ้าแยก service) -----
  ticketsApiUrl: getEnv('NEXT_PUBLIC_TICKETS_API_URL', ''),

  // ----- Reports API -----
  reportsApiUrl: getEnv('NEXT_PUBLIC_REPORTS_API_URL', ''),

  // ----- Change Password / Auth (เปลี่ยนรหัสผ่าน) -----
  changePasswordApiUrl: getEnv('NEXT_PUBLIC_CHANGE_PASSWORD_API_URL', ''),
} as const;

/** ใช้เช็คตอนรัน (optional): ถ้า URL ว่างอาจไม่ยิง request */
export function isConfigured(key: keyof typeof env): boolean {
  const url = env[key];
  return typeof url === 'string' && url.trim() !== '' && url !== '#';
}

export type EnvKeys = keyof typeof env;
