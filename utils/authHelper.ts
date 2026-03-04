/**
 * Modular Auth Utility — Single source of truth for session keys and logout.
 * Use AUTH_KEYS instead of magic strings; call clearAppSession() for full logout.
 */

import { AUTH_UNAUTHORIZED_EVENT } from '@/global/types/api';
import { clearAuthCookies } from '@/config/cookies';

/** All localStorage keys used for auth/session. Single source of truth — no hardcoding elsewhere. */
export const AUTH_KEYS = {
  AUTH_STORE: 'authStore',
  /** Legacy key from older persist; clear together with AUTH_STORE for safety */
  AUTH_STORE_LEGACY: 'auth-store',
  USER_PROFILE_STORE: 'userProfileStore',
  SIDE_MENU: 'sideMenu',
  TOKEN: 'token',
  /** Legacy: ลบเมื่อ Logout/401 (เคยใช้ใน login เก่า) */
  LASTIME: 'lastime',
  /** ลบเมื่อ Logout/401 เพื่อไม่ให้ ID พนักงานคนเก่าค้าง */
  EMPLOYEE_ID: 'employeeId',
} as const;

/**
 * ลบ auth/session keys ทั้งหมดจาก localStorage (อ้างอิงจาก AUTH_KEYS เท่านั้น).
 * Listeners (e.g. AuthSessionHandler) จะ clear Zustand state และ redirect ไป Login.
 */
export function clearAppSession(): void {
  if (typeof window === 'undefined') return;

  for (const key of Object.values(AUTH_KEYS)) {
    localStorage.removeItem(key);
  }
  clearAuthCookies();
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
}
