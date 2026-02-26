/**
 * จุดรวมการอ่าน Environment Variables ทั้งหมด
 * รองรับหลาย Backend โดยแต่ละตัวมี env แยก ชัดเจน และมี default สำหรับ dev
 *
 * ใช้: import { env } from '@/config/env';
 * แล้วใช้ env.helpdeskApiUrl, env.ticketsApiUrl ฯลฯ
 */

const getEnv = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined') {
    const val = (process.env as Record<string, string | undefined>)[key];
    return (val && val.trim()) || fallback;
  }
  return (process.env[key]?.trim()) || fallback;
};

/** ตรวจสอบตอนอ่านค่า (ให้ fallback dev ทำงานใน browser ตอน dev) */
const getIsDev = (): boolean =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/** ค่า fallback เฉพาะตอน development — ใช้เมื่อไม่ได้ตั้งใน .env.local */
const devFallback = {
  appUrl: 'http://localhost:3500',
  helpdeskApiUrl: 'https://api-test.edl.com.la/helpdesk/api',
  helpdeskUploadBaseUrl: 'https://api-test.edl.com.la/helpdesk/upload/categoryicons',
  ticketsApiUrl: 'http://localhost:3501',
  reportsApiUrl: 'http://localhost:3000/api',
  changePasswordApiUrl: '',
};

/** ค่า env — อ่านทุกครั้งที่เข้าถึง (getter) เพื่อให้ dev fallback ทำงานในโหมด development */
export const env = {
  get appUrl() {
    return getEnv('NEXT_PUBLIC_APP_URL', getIsDev() ? devFallback.appUrl : '');
  },
  get ogImageUrl() {
    return getEnv('NEXT_PUBLIC_OG_IMAGE_URL', '');
  },
  get helpdeskApiUrl() {
    return getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', getIsDev() ? devFallback.helpdeskApiUrl : '');
  },
  get helpdeskAuthLoginPath() {
    return getEnv('NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH', 'auth/login');
  },
  get helpdeskUploadBaseUrl() {
    const explicit = getEnv('NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL', '');
    if (explicit.trim()) return explicit.trim().replace(/\/$/, '');
    const apiBase = getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', getIsDev() ? devFallback.helpdeskApiUrl : '');
    if (!apiBase.trim()) return getIsDev() ? devFallback.helpdeskUploadBaseUrl : '';
    return apiBase.trim().replace(/\/api\/?$/, '').replace(/\/$/, '') + '/upload/categoryicons';
  },
  get loginUsePascalCase() {
    return getEnv('NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE', 'false').toLowerCase() === 'true';
  },
  /** Demo: save category icons to public/uploads/ and serve at /uploads/filename (no backend) */
  get useLocalCategoryIconUpload() {
    return getEnv('NEXT_PUBLIC_USE_LOCAL_CATEGORY_ICON_UPLOAD', 'false').toLowerCase() === 'true';
  },
  /** ใช้ proxy /api/proxy-helpdesk เพื่อ bypass CORS (frontend localhost → API อีก domain) */
  get useHelpdeskProxy() {
    return getEnv('NEXT_PUBLIC_USE_HELPDESK_PROXY', 'false').toLowerCase() === 'true';
  },
  get ticketsApiUrl() {
    return getEnv('NEXT_PUBLIC_TICKETS_API_URL', getIsDev() ? devFallback.ticketsApiUrl : '');
  },
  get reportsApiUrl() {
    return getEnv('NEXT_PUBLIC_REPORTS_API_URL', getIsDev() ? devFallback.reportsApiUrl : '');
  },
  get changePasswordApiUrl() {
    return getEnv('NEXT_PUBLIC_CHANGE_PASSWORD_API_URL', getIsDev() ? devFallback.changePasswordApiUrl : '');
  },
};

/** ใช้เช็คตอนรัน (optional): ถ้า URL ว่างอาจไม่ยิง request */
export function isConfigured(key: keyof typeof env): boolean {
  const url = env[key];
  return typeof url === 'string' && url.trim() !== '' && url !== '#';
}

export type EnvKeys = keyof typeof env;
