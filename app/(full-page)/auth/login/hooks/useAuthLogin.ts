'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authenStore } from '@/app/store/user/loginAuthStore';
import { useUsersStore } from '@/app/store/user/usersStore';
import { useUserProfileStore } from '@/app/store/user/userProfileStore';
import { getApiErrorMessage, AUTH_FORBIDDEN_MSG } from '@/global/types/api';
import { clearAppSession } from '@/utils/authHelper';
import type { LoginInput } from '@/global/validators/login.schema';
import type { ApiErrorResponseBody, AxiosErrorWithResponse } from '@/global/types/api';
import type { UserProfile } from '@/global/types';

export type ToastShowMessage = (
  severity: 'success' | 'info' | 'warn' | 'error',
  summary: string,
  detail: string
) => void;

// --- Helpers (ลดความซับซ้อนของ handleLogin) ---

function extractToken(body: Record<string, unknown>): string | undefined {
  return (body.token ?? body.accessToken) as string | undefined;
}

function extractUserFromResponse(body: Record<string, unknown>): UserProfile.UserLoginResponse | undefined {
  const user = body.user ?? (body as { data?: { user?: unknown } }).data?.user;
  return user as UserProfile.UserLoginResponse | undefined;
}

function getAuthIds(userObj: UserProfile.UserLoginResponse | undefined): { userId?: number; employeeId?: number } {
  const u = userObj as { id?: number; userId?: number; employeeId?: number; employee?: { id?: number } } | undefined;
  const userId = u?.id ?? u?.userId;
  const employeeId = u?.employeeId ?? (u?.employee?.id as number | undefined);
  return { userId, employeeId };
}

function getAfterLoginPath(roleId: number | null | undefined): string {
  if (roleId === 4) return '/uikit/GroupProblem';
  if (roleId === 1 || roleId === 2) return '/uikit/MainBoard';
  return '/uikit/pageTechn';
}

function getDisplayName(userObj: UserProfile.UserLoginResponse | undefined, fallback: string): string {
  const emp = userObj?.employee as { first_name?: string; last_name?: string } | undefined;
  const name = `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim();
  return name || fallback;
}

function getRoleId(userObj: UserProfile.UserLoginResponse | undefined): number | null | undefined {
  const u = userObj as { roleId?: number; role?: { id?: number } } | undefined;
  return u?.roleId ?? u?.role?.id ?? null;
}

function getLoginErrorFallback(status: number | undefined): string {
  if (status === 400) return 'ຂໍ້ມູນບໍ່ຖືກຕ້ອງ (ກະລຸນາກວດສອບຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ)';
  if (status === 401) return 'ໄອດີ ຫຼື ລະຫັດຜິດ';
  if (status === 404) return 'ບໍ່ພົບ API ເຂົ້າລະບົບ — ກວດສອບ NEXT_PUBLIC_HELPDESK_API_BASE_URL ໃນ .env.local ແລະວ່າ Backend ເປີດແລ້ວ';
  return 'ເກີດຂໍ້ຜິດພາດຈາກເຊີເວີ';
}

/**
 * Custom Hook: จัดการ Logic การ Login ทั้งหมด (SRP)
 * - เรียก API ผ่าน useUsersStore.loginUser
 * - เก็บ Token ผ่าน authenStore (แหล่งเดียว ไม่เขียน localStorage เอง)
 * - อัปเดต Profile Store และ redirect
 */
export function useAuthLogin(showMessage: ToastShowMessage) {
  const router = useRouter();
  const { loginUser } = useUsersStore();
  const setAuthData = authenStore((s) => s.setAuthData);
  const [isLoading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (data: LoginInput) => {
      setLoading(true);
      try {
        const resp = await loginUser(data);

        if (resp.status !== 200 && resp.status !== 201) {
          showMessage(
            'error',
            'Login Failed',
            (resp.data as { message?: string })?.message ?? 'ໄອດີ ຫຼື ລະຫັດຜິດ'
          );
          setLoading(false);
          return;
        }

        const body = (resp.data ?? {}) as Record<string, unknown>;
        const token = extractToken(body);
        const userObj = extractUserFromResponse(body);

        if (!token) {
          showMessage('error', 'Data Error', 'Login สำเร็จแต่ไม่พบ Token (API Structure Mismatch)');
          setLoading(false);
          return;
        }

        const { userId, employeeId } = getAuthIds(userObj);
        const actived = (userObj as unknown as Record<string, unknown> | undefined)?.actived;
        if (actived === 'C' || userId == null) {
          clearAppSession();
          authenStore.getState().clearAuthData();
          showMessage('error', 'ເຂົ້າລະບົບບໍ່ສຳເລັດ', 'ຂໍ້ມູນທ່ານບໍ່ໄດ້ຢູ່ໃນລະບົບ');
          setLoading(false);
          return;
        }
        setAuthData({
          tokenType: 'Bearer',
          accessToken: token,
          ...(userId != null && { userId }),
          ...(employeeId != null && { employeeId }),
        });

        const displayName = getDisplayName(userObj, data.username);
        showMessage('success', 'Login Successful', `ຍິນດີຕ້ອນຮັບທ່ານ ${displayName}`);

        if (userObj?.employee) {
          useUserProfileStore.getState().setCurrentUser(userObj);
          try {
            await useUserProfileStore.getState().fetchUserProfile();
          } catch {
            // Profile fetch ล้มเหลวไม่บล็อกการ redirect
          }
        }

        const roleId = getRoleId(userObj);
        const afterLoginPath = getAfterLoginPath(roleId);
        setTimeout(() => {
          router.push(afterLoginPath);
          setLoading(false);
        }, 500);
      } catch (error: unknown) {
        const err = error as AxiosErrorWithResponse;
        const status = err?.response?.status;
        const errMsg = err?.message ?? '';
        const errName = (error as { name?: string })?.name;
        const errCode = (error as { code?: string })?.code;
        const isUnauthorized = status === 401 || errName === 'UnauthorizedError' || errCode === 'UNAUTHORIZED';
        const isForbidden = status === 403 || errMsg === AUTH_FORBIDDEN_MSG;
        const isDeactivatedOrNotFound = isUnauthorized || isForbidden;
        if (isDeactivatedOrNotFound) {
          showMessage('error', 'ເຂົ້າລະບົບບໍ່ສຳເລັດ', 'ທ່ານບໍ່ມີຂໍ້ມູນໃນລະບົບ');
          setLoading(false);
          return;
        }
        const responseData = err?.response?.data as ApiErrorResponseBody | string | undefined;
        const fallback = getLoginErrorFallback(status);
        const msg = err?.message ?? '';
        const message =
          msg.includes('NEXT_PUBLIC_HELPDESK_API_BASE_URL')
            ? msg
            : getApiErrorMessage(responseData, fallback);
        showMessage('error', 'ເຂົ້າລະບົບບໍ່ສຳເລັດ', message);
        setLoading(false);
      }
    },
    [loginUser, setAuthData, router, showMessage]
  );

  return { handleLogin, isLoading };
}
