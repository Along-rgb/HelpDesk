/**
 * API เปลี่ยนรหัสผ่าน — เรียก PUT /users/changepassword/:id
 * Body ตาม spec: oldpassword, password1, password2
 */
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

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
 * PUT /users/changepassword/:userId
 * Body: oldpassword, password1, password2
 */
export const changePasswordAPI = async (data: ChangePasswordForm, userId: number | string): Promise<unknown> => {
  const body = {
    oldpassword: data.currentPassword,
    password1: data.newPassword,
    password2: data.confirmPassword,
  };

  try {
    const response = await axiosClientsHelpDesk.put(`users/changepassword/${userId}`, body);
    return response.data;
  } catch (error: unknown) {
    const msg =
      error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
    throw new Error(typeof msg === 'string' ? msg : 'ລະບົບມີບັນຫາ ຫຼື ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບໄດ້');
  }
};
