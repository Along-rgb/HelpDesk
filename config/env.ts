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

/** ค่า env ที่ใช้ในแอป (หลาย Backend) */
export const env = {
  // ----- HelpDesk API (users, auth, departments, ... ທັງໝົດຢູ່ under /helpdesk/api) -----
  /** baseURL ລວມ /api ແລ້ວ — ບໍ່ໃສ່ /api/ ຊ້ຳໃນ path ອື່ນ */
  helpdeskApiUrl:
    getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', 'https://api-test.edl.com.la/helpdesk/api'),
  /** Path สำหรับ login (ต่อกับ helpdeskApiUrl, ເຊັ່ນ auth/login → .../helpdesk/api/auth/login) */
  helpdeskAuthLoginPath:
    getEnv('NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH', 'auth/login'),
  /** ถ้า backend ใช้ userName (PascalCase) แทน username ให้ตั้งเป็น 'true' */
  loginUsePascalCase:
    getEnv('NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE', 'false').toLowerCase() === 'true',

  // ----- Tickets API (สร้าง/ดึง/อัปเดต ticket — ถ้าแยก service) -----
  ticketsApiUrl:
    getEnv('NEXT_PUBLIC_TICKETS_API_URL', 'http://localhost:3501'),

  // ----- Reports API -----
  reportsApiUrl:
    getEnv('NEXT_PUBLIC_REPORTS_API_URL', 'http://localhost:3000/api'),

  // ----- Change Password / Auth (เปลี่ยนรหัสผ่าน) -----
  changePasswordApiUrl:
    getEnv('NEXT_PUBLIC_CHANGE_PASSWORD_API_URL', ''),

  // ----- อื่นๆ (ถ้ามีเพิ่มภายหลัง) -----
  // exampleApiUrl: getEnv('NEXT_PUBLIC_EXAMPLE_API_URL', 'http://localhost:8080'),
} as const;

/** ใช้เช็คตอนรัน (optional): ถ้า URL ว่างอาจไม่ยิง request */
export function isConfigured(key: keyof typeof env): boolean {
  const url = env[key];
  return typeof url === 'string' && url.trim() !== '' && url !== '#';
}

export type EnvKeys = keyof typeof env;
