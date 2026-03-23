import axios, { type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { AUTH_KEYS, clearAppSession } from '@/utils/authHelper';
import { UnauthorizedError, AUTH_FORBIDDEN_TOAST_EVENT, AUTH_FORBIDDEN_MSG } from '@/global/types/api';
import { authenStore } from '@/app/store/user/loginAuthStore';

const getHelpdeskBaseUrl = (): string => {
  if (typeof window !== 'undefined' && env.useHelpdeskProxy) {
    return '/api/proxy-helpdesk';
  }
  return env.helpdeskApiUrl;
};

const axiosClientsHelpDesk = axios.create({
  baseURL: env.helpdeskApiUrl,
});

/** Parsed shape of persisted auth store state (read-only). */
interface PersistedAuthState {
  state?: { authData?: { accessToken?: string; issuedAt?: number } };
}

function readAuthFromStorage(): { token: string | null; issuedAt: number | null } {
  if (typeof window === 'undefined') return { token: null, issuedAt: null };
  try {
    const raw = localStorage.getItem(AUTH_KEYS.AUTH_STORE);
    if (!raw) return { token: null, issuedAt: null };
    const parsed = JSON.parse(raw) as PersistedAuthState;
    const auth = parsed?.state?.authData;
    const token = auth?.accessToken ?? null;
    const issued = auth?.issuedAt;
    const issuedAt =
      typeof issued === 'number' && !Number.isNaN(issued) ? issued : null;
    return { token, issuedAt };
  } catch {
    return { token: null, issuedAt: null };
  }
}

/** อ่าน Token ล่าสุดจาก Store ก่อน (หลัง Login ยังไม่ persist ทันที) แล้ว fallback localStorage */
function getLatestToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromStore = authenStore.getState().authData?.accessToken;
    if (fromStore) return fromStore;
  } catch {
    // ignore
  }
  return readAuthFromStorage().token;
}

/**
 * Returns the current access token (Store ก่อน → fallback localStorage).
 */
export function getTokenFromStorage(): string | null {
  return getLatestToken();
}

function attachAuthToRequest(config: InternalAxiosRequestConfig): void {
  // Do NOT set Content-Type for FormData. The browser/runtime must set
  // multipart/form-data with the correct boundary; manually setting
  // Content-Type to multipart/form-data (without boundary) causes 500 errors
  // because the server cannot parse the request body.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  } else {
    config.headers.set('Content-Type', 'application/json');
  }
  config.headers.set('Accept', 'application/json, text/plain, */*');

  const method = String(config.method ?? '').toLowerCase();
  if (method === 'get') {
    config.headers.set('Cache-Control', 'no-store');
    config.headers.set('Pragma', 'no-cache');
    config.headers.delete('If-None-Match');
    config.headers.delete('if-none-match');
  }

  const token = getLatestToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
}

/** 401: ເອີ້ນ clearAppSession ເພື່ອລຶບ auth-store ແລະ employeeId ອອກຈາກ localStorage ປ້ອງກັນຂໍ້ມູນຄົນເກົ່າຄາງ */
function handle401(): Promise<never> {
  clearAppSession();
  return Promise.reject(new UnauthorizedError('Unauthorized'));
}

function is401(error: { response?: { status?: number; data?: { code?: number; error?: string } } }): boolean {
  const res = error.response;
  if (!res) return false;
  if (res.status === 401) return true;
  return res.data?.code === 401 && res.data?.error === 'Unauthorized';
}

function is403(error: { response?: { status?: number } }): boolean {
  return error.response?.status === 403;
}

// --- Request interceptor ---
axiosClientsHelpDesk.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.baseURL = getHelpdeskBaseUrl();
    const base = config.baseURL ?? axiosClientsHelpDesk.defaults.baseURL;
    if (!base || String(base).trim() === '') {
      return Promise.reject(
        new Error(
          'NEXT_PUBLIC_HELPDESK_API_BASE_URL is not set. Add it to .env.local (e.g. your backend URL ending with /helpdesk/api) and restart the dev server.'
        )
      );
    }
    attachAuthToRequest(config);
    return config;
  },
  (err: unknown) => Promise.reject(err)
);

// --- Response: 401 → clearAppSession + redirect; 403 → ແສງ Toast ເທົ່ານັ້ນ (ບໍ່ logout) ---
axiosClientsHelpDesk.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (is401(error as { response?: { status?: number; data?: { code?: number; error?: string } } })) {
      return handle401();
    }
    if (is403(error as { response?: { status?: number } })) {
      const skipToast = (error as { config?: Record<string, unknown> }).config?.__skipForbiddenToast === true;
      if (typeof window !== 'undefined' && !skipToast) {
        window.dispatchEvent(new CustomEvent(AUTH_FORBIDDEN_TOAST_EVENT, { detail: { message: AUTH_FORBIDDEN_MSG } }));
      }
      return Promise.reject(new Error(AUTH_FORBIDDEN_MSG));
    }
    return Promise.reject(error);
  }
);

export default axiosClientsHelpDesk;
