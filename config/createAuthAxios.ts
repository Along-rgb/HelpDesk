/**
 * Creates an axios instance with auth header and 401 handling (clear session).
 * Use for APIs that use the same token as Helpdesk but a different base URL
 * (e.g. change password, tickets service).
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getTokenFromStorage } from '@/config/axiosClientsHelpDesk';
import { clearAppSession } from '@/utils/authHelper';
import { UnauthorizedError } from '@/global/types/api';

function is401(error: { response?: { status?: number; data?: { code?: number; error?: string } } }): boolean {
  const res = error.response;
  if (!res) return false;
  if (res.status === 401) return true;
  return res.data?.code === 401 && res.data?.error === 'Unauthorized';
}

export function createAuthAxios(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL: baseURL || undefined,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getTokenFromStorage();
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
      return config;
    },
    (err) => Promise.reject(err)
  );

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (is401(error)) {
        clearAppSession();
        return Promise.reject(new UnauthorizedError('Unauthorized'));
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
