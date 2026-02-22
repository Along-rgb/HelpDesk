// =====================================================
// API Response & Error Types (Auth & Axios)
// ใช้แทน any ใน Login, Interceptor และ Services
// =====================================================

import type { UserProfile } from './userProfile';

/** ชื่อ Custom Event เมื่อได้ 401 / token หมดอายุ — ให้ Layout/AuthProvider ฟังแล้วเคลียร์ state + redirect */
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

/** ชื่อ Custom Event เมื่อได้ 403 — แสดง toast สีแดง แล้วเมื่อปิดให้ redirect ไป login (ครั้งเดียว) */
export const AUTH_FORBIDDEN_TOAST_EVENT = 'auth:forbidden-toast';

/** ข้อความแจ้งเตือนเมื่อได้ 403 (Master Data Protection) — ใช้ทั้งใน Axios interceptor และ ForbiddenToastHandler */
export const AUTH_FORBIDDEN_MSG = 'ທ່ານບໍ່ໄດ້ຮັບອະນຸຍາດ!!';

/** Error ที่ Axios Interceptor throw เมื่อ 401 หรือ token หมดอายุ — ไม่ import store ใน config */
export class UnauthorizedError extends Error {
  readonly code = 'UNAUTHORIZED';
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * โครงสร้าง Response จาก API Login (Backend)
 * รองรับทั้ง token / accessToken และ user object
 */
export interface LoginApiResponse {
  token?: string;
  accessToken?: string;
  user?: UserProfile.UserLoginResponse;
}

/**
 * โครงสร้างที่ Axios คืนมาเมื่อ success (response.data = body)
 */
export interface LoginApiSuccessResponse {
  data: LoginApiResponse;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config?: unknown;
}

/**
 * Error response body ที่ Backend ส่งกลับ (เช่น 400, 401, 404)
 */
export interface ApiErrorResponseBody {
  message?: string;
  error?: string;
  code?: number;
  errors?: Array<{ message?: string; field?: string } | string>;
}

/**
 * Axios Error ที่มี response จาก server (ใช้แทน error: any)
 */
export interface AxiosErrorWithResponse {
  message?: string;
  response?: {
    status: number;
    statusText: string;
    data?: ApiErrorResponseBody | string;
  };
  config?: unknown;
}

/**
 * ดึงข้อความ error จาก ApiErrorResponseBody หรือ AxiosErrorWithResponse
 */
export function getApiErrorMessage(
  data: ApiErrorResponseBody | string | undefined,
  fallback: string
): string {
  if (data == null) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string' && data.message) return data.message;
  if (data.error) return String(data.error);
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const parts = data.errors
      .map((e) => (typeof e === 'object' && e?.message ? e.message : String(e)))
      .filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return fallback;
}
