/**
 * จุดรวมการอ่าน Environment Variables ทั้งหมด
 * รองรับหลาย Backend โดยแต่ละตัวมี env แยก ชัดเจน และมี default สำหรับ dev
 *
 * ใช้: import { env } from '@/config/env';
 * แล้วใช้ env.helpdeskApiUrl, env.ticketsApiUrl ฯลฯ
 */

/**
 * Next.js จะ inline ค่า env ฝั่ง client ได้ "เฉพาะ" การอ้างแบบตรง ๆ เช่น
 * process.env.NEXT_PUBLIC_FOO (ไม่ใช่ process.env[key]).
 * ดังนั้นต้อง map key → direct reference เพื่อให้ค่าใน browser ถูกต้อง.
 */
const PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_OG_IMAGE_URL: process.env.NEXT_PUBLIC_OG_IMAGE_URL,
  NEXT_PUBLIC_HELPDESK_API_BASE_URL: process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL,
  NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH: process.env.NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH,
  NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL: process.env.NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL,
  NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE: process.env.NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE,
  NEXT_PUBLIC_USE_LOCAL_CATEGORY_ICON_UPLOAD: process.env.NEXT_PUBLIC_USE_LOCAL_CATEGORY_ICON_UPLOAD,
  NEXT_PUBLIC_USE_HELPDESK_PROXY: process.env.NEXT_PUBLIC_USE_HELPDESK_PROXY,
  NEXT_PUBLIC_TICKETS_API_URL: process.env.NEXT_PUBLIC_TICKETS_API_URL,
  NEXT_PUBLIC_REPORTS_API_URL: process.env.NEXT_PUBLIC_REPORTS_API_URL,
  NEXT_PUBLIC_CHANGE_PASSWORD_API_URL: process.env.NEXT_PUBLIC_CHANGE_PASSWORD_API_URL,
  NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME: process.env.NEXT_PUBLIC_IMAGE_REMOTE_HOSTNAME,
  NEXT_PUBLIC_TICKET_ID_SECRET: process.env.NEXT_PUBLIC_TICKET_ID_SECRET,
  NEXT_PUBLIC_HELPDESK_IMAGES_PATH: process.env.NEXT_PUBLIC_HELPDESK_IMAGES_PATH,
  NEXT_PUBLIC_HELPDESK_FIELD_FILE: process.env.NEXT_PUBLIC_HELPDESK_FIELD_FILE,
  NEXT_PUBLIC_HELPDESK_FIELD_IMAGES: process.env.NEXT_PUBLIC_HELPDESK_FIELD_IMAGES,
};

const getEnv = (key: string, fallback: string): string => {
  const raw = (PUBLIC_ENV[key] ?? process.env[key])?.trim();
  return raw && raw !== '' ? raw : fallback;
};

/** ตรวจสอบตอนอ่านค่า (ให้ fallback dev ทำงานใน browser ตอน dev) */
const getIsDev = (): boolean =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/** Path ตาม Backend: subdomain/upload/categoryicon (ไม่มี s ท้าย categoryicon) */
const UPLOAD_CATEGORYICON_PATH = '/upload/categoryicon';

/** ค่า fallback เมื่อ process.env ไม่ตั้ง — ใช้เมื่อ .env.local ไม่มีหรือว่าง (dev/test). ค่า API จริงให้ตั้งใน .env.local */
const devFallback = {
  appUrl: 'http://localhost:3500',
  helpdeskApiUrl: '',
  helpdeskUploadBaseUrl: '',
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
  /** อ่านจาก process.env.NEXT_PUBLIC_HELPDESK_API_BASE_URL; ຕ້ອງມີ protocol (http:// ຫຼື https://) ຄົບຖ້ວນ. Fallback เฉพาะโหมด development */
  get helpdeskApiUrl() {
    return getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', getIsDev() ? devFallback.helpdeskApiUrl : '');
  },
  get helpdeskAuthLoginPath() {
    return getEnv('NEXT_PUBLIC_HELPDESK_AUTH_LOGIN_PATH', 'auth/login');
  },
  /** Subdomain จาก env — ต่อกับ UPLOAD_CATEGORYICON_PATH */
  get helpdeskUploadBaseUrl() {
    const explicit = getEnv('NEXT_PUBLIC_HELPDESK_UPLOAD_BASE_URL', '');
    if (explicit.trim()) return explicit.trim().replace(/\/+$/, '');
    const apiBase = getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', getIsDev() ? devFallback.helpdeskApiUrl : '');
    if (!apiBase.trim()) return getIsDev() ? devFallback.helpdeskUploadBaseUrl : '';
    const subdomain = apiBase.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
    return subdomain + UPLOAD_CATEGORYICON_PATH;
  },
  get loginUsePascalCase() {
    return getEnv('NEXT_PUBLIC_LOGIN_USE_PASCAL_CASE', 'false').toLowerCase() === 'true';
  },
  /** Demo: save category icons to public/uploads/ and serve at /uploads/filename (no backend) */
  get useLocalCategoryIconUpload() {
    return getEnv('NEXT_PUBLIC_USE_LOCAL_CATEGORY_ICON_UPLOAD', 'false').toLowerCase() === 'true';
  },
  /** Base สำหรับอัปโหลด hdfile / hdimage: .../helpdesk/upload (ไม่รวม /api) */
  get helpdeskUploadRequestBaseUrl() {
    const apiBase = getEnv('NEXT_PUBLIC_HELPDESK_API_BASE_URL', getIsDev() ? devFallback.helpdeskApiUrl : '');
    if (!apiBase.trim()) return '';
    return apiBase.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '') + '/upload';
  },
  /** ใช้ proxy /api/proxy-helpdesk เพื่อ bypass CORS (frontend localhost → API อีก domain) */
  get useHelpdeskProxy() {
    return getEnv('NEXT_PUBLIC_USE_HELPDESK_PROXY', 'false').toLowerCase() === 'true';
  },
  /** Path segment สำหรับโหลดรูป (hdImgs) บน Backend — default hdimage, ຖ້າ Backend ໃຊ້ hdImgs ໃຫ້ຕັ້ງທີ່ນີ້ */
  get helpdeskImagesPath() {
    return getEnv('NEXT_PUBLIC_HELPDESK_IMAGES_PATH', 'hdimage').trim() || 'hdimage';
  },
  /** Field name สำหรับแนบไฟล์ PDF ใน FormData ตอน POST/PUT helpdeskrequests */
  get helpdeskFieldFile() {
    return getEnv('NEXT_PUBLIC_HELPDESK_FIELD_FILE', 'hdFile').trim() || 'hdFile';
  },

  /** Field name สำหรับแนบรูป (append ซ้ำได้) ใน FormData ตอน POST/PUT helpdeskrequests */
  get helpdeskFieldImages() {
    return getEnv('NEXT_PUBLIC_HELPDESK_FIELD_IMAGES', 'hdImgs').trim() || 'hdImgs';
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
