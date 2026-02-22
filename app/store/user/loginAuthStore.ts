import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { AUTH_KEYS } from '@/utils/authHelper';

type Auth = {
  tokenType: string;
  accessToken: string;
  /** Client-side issued-at timestamp for token expiry check (Axios interceptor). */
  issuedAt?: number;
  /** ใช้ดึง profile เมื่อ currentUser ใน profile store ยังไม่มี (เช่น refresh หน้า) */
  employeeId?: number | string;
  /** User id จาก API (id ใน response /api/users/) ใช้เรียก GET /api/users/:id */
  userId?: number | string;
};

type Store = {
  authData: Auth | null;
  setAuthData: (data: Auth) => void;
  clearAuthData: () => void;
};

export const authenStore = create<Store>()(
  devtools(
    persist(
      (set) => ({
        authData: null,
        setAuthData: (data) => {
          set(() => ({
            authData: {
              ...data,
              issuedAt: data.issuedAt ?? Date.now(),
            },
          }));
        },
        clearAuthData: () => set(() => ({ authData: null })),
      }),
      { name: AUTH_KEYS.AUTH_STORE }
    )
  )
);