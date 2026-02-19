import axios from 'axios';
import { env } from './env';

const axiosClientsHelpDesk = axios.create({
  baseURL: env.helpdeskApiUrl,
  // withCredentials: true,
});

const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000; // 2 ชั่วโมง

// Request Interceptor
axiosClientsHelpDesk.interceptors.request.use(
  async (config: any) => {
    config.headers = {
      'Content-Type': 'application/json',
      "Accept": "application/json, text/plain, */*",
      ...config.headers,
    };

    // Avoid cached GET responses (304 with empty body)
    if (String(config.method || '').toLowerCase() === 'get') {
      config.headers['Cache-Control'] = 'no-store';
      config.headers['Pragma'] = 'no-cache';
      // best-effort: prevent conditional requests if present
      delete config.headers['If-None-Match'];
      delete config.headers['if-none-match'];
    }

    // Token expiry check (simple frontend policy)
    const issuedAtStr = localStorage.getItem('tokenIssuedAt');
    if (issuedAtStr) {
      const issuedAt = Number(issuedAtStr);
      if (!Number.isNaN(issuedAt)) {
        const age = Date.now() - issuedAt;
        if (age > MAX_TOKEN_AGE_MS) {
          // token หมดอายุในฝั่ง frontend
          localStorage.removeItem('token');
          localStorage.removeItem('tokenIssuedAt');
          localStorage.removeItem('authStore');
          localStorage.removeItem('userProfileStore');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(new Error('Token expired (frontend policy).'));
        }
      }
    }

    // Add Bearer Token if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosClientsHelpDesk.interceptors.response.use(
  (response) => {
    // Handle success responses
    // if (response.status === 200 || response.status === 201) {
    //   // return response?.data; // Return only the data for cleaner usage
    //   return response; 
    // }
    return response;
  },
  (error) => {
    if (error.response) {
      const response = error.response;
      if (response?.status === 401 || (response?.data?.code === 401 && response?.data?.error === 'Unauthorized')) {
        console.log('Unauthorized', response);

        // เคลียร์ token / local storage ทั้งหมดที่เกี่ยวข้อง
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('token');
        localStorage.removeItem('tokenIssuedAt');
        localStorage.removeItem('authStore');
        localStorage.removeItem('userProfileStore');
        localStorage.removeItem('sideMenu');

        // พยายามเคลียร์ Zustand stores (ไม่ผูก dependency ตรง ๆ)
        import('@/app/store/user/loginAuthStore')
          .then((mod) => {
            try {
              mod.authenStore.getState().clearAuthData();
            } catch (e) {
              console.error('Failed to clear authenStore', e);
            }
          })
          .catch(() => {/* ignore */});

        import('@/app/store/user/userProfileStore')
          .then((mod) => {
            try {
              mod.useUserProfileStore.getState().clearProfile();
            } catch (e) {
              console.error('Failed to clear userProfileStore', e);
            }
          })
          .catch(() => {/* ignore */});

        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      } else {
        // ບໍ່ໃຊ້ console.error ເພື່ອຫຼີກລ່ຽງ duplicate ກັບ toast ໃນ useCoreApi — ໃຊ້ warn ໃນ dev ເທົ່ານັ້ນ
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[API] ${response.status} ${response.statusText}: ${error.config?.url ?? error.config?.baseURL ?? 'request'}`
          );
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClientsHelpDesk;