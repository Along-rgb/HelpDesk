/**
 * เคลียร์ Cookie ที่เกี่ยวกับ Auth อย่างปลอดภัย
 * ใช้หลาย path/domain เพื่อลดความเสี่ยงที่ Cookie จะไม่ถูกลบเพราะ Domain หรือ Path ไม่ตรงกับตอนที่ set
 *
 * หมายเหตุ: Cookie ที่ตั้งเป็น HttpOnly ไม่สามารถลบจาก JavaScript ได้
 * ถ้า Backend set token เป็น HttpOnly ต้องให้ API Logout ส่ง Set-Cookie หมดอายุแทน
 */

const EXPIRED_DATE = 'Thu, 01 Jan 1970 00:00:00 UTC';

const AUTH_COOKIE_NAMES = ['token', 'accessToken', 'auth', 'session'] as const;

function clearCookie(name: string, path: string, domain?: string): void {
  let value = `${name}=; expires=${EXPIRED_DATE}; path=${path}; max-age=0`;
  if (domain) value += `; domain=${domain}`;
  document.cookie = value;
}

/**
 * ลบ auth-related cookies โดยลองหลาย path และ domain
 * เรียกใช้เมื่อ logout / 401 เท่านั้น (ฝั่ง client)
 */
export function clearAuthCookies(cookieNames: string[] = [...AUTH_COOKIE_NAMES]): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const pathVariants = ['/', ''];
  const hostname = window.location.hostname;
  const domainVariants: (string | undefined)[] = [undefined];
  if (hostname && !hostname.startsWith('localhost')) {
    domainVariants.push(hostname, `.${hostname}`);
  }

  for (const name of cookieNames) {
    for (const path of pathVariants) {
      for (const domain of domainVariants) {
        clearCookie(name, path, domain);
      }
    }
  }
}
