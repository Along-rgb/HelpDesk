// =====================================================
// Profile Service - API Integration
// จัดการการเรียก API สำหรับ User Profile
// =====================================================

import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { UserProfile } from '@/global/types';

/**
 * ດຶງຂໍ້ມູນ User Profile ຈາກ API /users/{employeeId}
 * ใช้ employeeId จาก localStorage (ถูกเซ็ตตอน login)
 * @returns User Profile Data
 */
export const getUserProfile = async (): Promise<UserProfile.UserLoginResponse> => {
  try {
    const employeeId = localStorage.getItem('employeeId');
    if (!employeeId) {
      throw new Error('ບໍ່ພົບ employeeId ກະລຸນາ Login ໃໝ່');
    }

    const response = await axiosClientsHelpDesk.get(`users/${employeeId}`, {
      params: { _ts: Date.now() },
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
    });

    if (response.status === 200 && response.data) {
      // รองรับ { data: <user> } หรือ <user> ตรง ๆ
      const userData = (response.data?.data ?? response.data) as UserProfile.UserLoginResponse;
      return userData;
    }

    throw new Error('ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້');
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw error?.response?.data || error;
  }
};

/**
 * อัปเดตข้อมูล User Profile
 * @param data - ข้อมูลที่ต้องการอัปเดต
 */
export const updateUserProfile = async (
  data: UserProfile.UpdateProfileRequest
): Promise<any> => {
  try {
    const response = await axiosClientsHelpDesk.put('users/update', data);

    if (response.status === 200) {
      return response.data;
    }

    throw new Error('ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້');
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw error?.response?.data || error;
  }
};

// =====================================================
// Master Data APIs (ຝ່າຍ, ພະແນກ, ຕຳແໜ່ງ)
// =====================================================

/** ດຶງລາຍການຝ່າຍ (Department) - GET /api/departments */
export const getDepartments = async (): Promise<UserProfile.Department[]> => {
  const response = await axiosClientsHelpDesk.get('departments', {
    params: { _ts: Date.now() },
  });
  const raw = response.data?.data ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

/** ດຶງລາຍການພະແນກ (Division) - GET /api/divisions */
export const getDivisions = async (): Promise<UserProfile.Division[]> => {
  const response = await axiosClientsHelpDesk.get('divisions', {
    params: { _ts: Date.now() },
  });
  const raw = response.data?.data ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

/** ດຶງລາຍການຕຳແໜ່ງ (Position) - GET /api/positions */
export const getPositions = async (): Promise<UserProfile.Position[]> => {
  const response = await axiosClientsHelpDesk.get('positions', {
    params: { _ts: Date.now() },
  });
  const raw = response.data?.data ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

/** ດຶງລາຍການรหัสຕຳແໜ່ງ (PositionCode) - GET /api/positioncodes */
export const getPositionCodes = async (): Promise<UserProfile.PositionCode[]> => {
  const response = await axiosClientsHelpDesk.get('positioncodes', {
    params: { _ts: Date.now() },
  });
  const raw = response.data?.data ?? response.data;
  return Array.isArray(raw) ? raw : [];
};

/**
 * ດຶງຂໍ້ມູນ Master Data (Dropdown Options) ทั้งหมด
 */
export const getMasterData = async () => {
  try {
    const [departments, divisions, positions, positionCodes] = await Promise.all([
      getDepartments(),
      getDivisions(),
      getPositions(),
      getPositionCodes(),
    ]);
    return {
      departments,
      divisions,
      positions,
      positionCodes,
    };
  } catch (error) {
    console.error('Error fetching master data:', error);
    return {
      departments: [] as UserProfile.Department[],
      divisions: [] as UserProfile.Division[],
      positions: [] as UserProfile.Position[],
      positionCodes: [] as UserProfile.PositionCode[],
    };
  }
};
