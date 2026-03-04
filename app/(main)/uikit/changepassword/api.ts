// api.ts — ใช้ createAuthAxios เพื่อให้ 401 clear session เหมือน Helpdesk
import { env, isConfigured } from '@/config/env';
import { createAuthAxios } from '@/config/createAuthAxios';
import { UnauthorizedError } from '@/global/types/api';

export const validateForm = (data: { currentPassword?: string; newPassword?: string; confirmPassword?: string }) => {
  if (!data.currentPassword || !data.newPassword || !data.confirmPassword) {
    return { isValid: false, message: 'ກະລຸນາຕື່ມຂໍ້ມູນໃຫ້ຄົບຖ້ວນ (Please fill all fields)' };
  }
  if (data.newPassword !== data.confirmPassword) {
    return { isValid: false, message: 'ລະຫັດຜ່ານໃໝ່ບໍ່ກົງກັນ (New passwords do not match)' };
  }
  if (data.newPassword.length < 6) {
    return { isValid: false, message: 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ (Password too short)' };
  }
  return { isValid: true, message: '' };
};

export const changePasswordAPI = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
  if (!isConfigured('changePasswordApiUrl')) {
    throw new Error('ລະບົບຍັງບໍ່ໄດ້ຕັ້ງຄ່າ API ປ່ຽນລະຫັດຜ່ານ — ກະລຸນາຕັ້ງ NEXT_PUBLIC_CHANGE_PASSWORD_API_URL ใน .env');
  }
  const baseUrl = env.changePasswordApiUrl.trim().replace(/\/+$/, '');
  const client = createAuthAxios(baseUrl);

  try {
    const response = await client.post('', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data;
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) throw error;
    const msg =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
    throw new Error(typeof msg === 'string' ? msg : 'ລະບົບມີບັນຫາ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້');
  }
};