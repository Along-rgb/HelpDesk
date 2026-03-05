/**
 * API เปลี่ยนรหัสผ่าน — เรียก POST /api/users/changepassword (Next.js Route)
 * หรือเรียก Backend โดยตรงถ้าตั้ง NEXT_PUBLIC_CHANGE_PASSWORD_API_URL
 * Body ตาม spec: oldpassword, password1, password2
 */
import { env, isConfigured } from '@/config/env';
import { createAuthAxios } from '@/config/createAuthAxios';
import { UnauthorizedError } from '@/global/types/api';
import { HELPDESK_ENDPOINTS } from '@/config/endpoints';

const MIN_PASSWORD_LENGTH = 6;

export type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const validateForm = (data: {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}): { isValid: boolean; message: string } => {
  if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
    return { isValid: false, message: 'ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (Please fill all fields)' };
  }
  if (data.newPassword !== data.confirmPassword) {
    return { isValid: false, message: 'ລະຫັດຜ່ານໃໝ່ບໍ່ກົງກັນ (New passwords do not match)' };
  }
  if (data.newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ ${MIN_PASSWORD_LENGTH} ຕົວອັກສອນ`,
    };
  }
  return { isValid: true, message: '' };
};

/**
 * ส่ง body ตาม spec: oldpassword, password1, password2
 * - ถ้ามี NEXT_PUBLIC_CHANGE_PASSWORD_API_URL จะยิงไปที่ URL นั้น (path ว่าง หรือ path ตาม endpoint)
 * - ถ้าไม่มี จะยิงไปที่ same-origin /api/users/changepassword
 */
export const changePasswordAPI = async (data: ChangePasswordForm): Promise<unknown> => {
  const body = {
    oldpassword: data.currentPassword,
    password1: data.newPassword,
    password2: data.confirmPassword,
  };

  if (isConfigured('changePasswordApiUrl')) {
    const baseUrl = env.changePasswordApiUrl.trim().replace(/\/+$/, '');
    const client = createAuthAxios(baseUrl);
    try {
      const path = HELPDESK_ENDPOINTS.CHANGE_PASSWORD.startsWith('/') ? HELPDESK_ENDPOINTS.CHANGE_PASSWORD : `/${HELPDESK_ENDPOINTS.CHANGE_PASSWORD}`;
      const response = await client.post(path, body);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) throw error;
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      throw new Error(typeof msg === 'string' ? msg : 'ລະບົບມີບັນຫາ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້');
    }
  }

  // ใช้ Next.js API Route ในแอป (same-origin)
  const token = (await import('@/config/axiosClientsHelpDesk')).getTokenFromStorage();
  if (!token) {
    throw new UnauthorizedError('Unauthorized');
  }
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/api/users/changepassword`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const message = typeof (json as { message?: string }).message === 'string' ? (json as { message: string }).message : '';

  if (res.status === 401) {
    const { clearAppSession } = await import('@/utils/authHelper');
    clearAppSession();
    throw new UnauthorizedError(message || 'Unauthorized');
  }
  if (!res.ok) {
    throw new Error(message || 'ລະບົບມີບັນຫາ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້');
  }
  return json;
};
