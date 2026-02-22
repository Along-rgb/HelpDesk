// =====================================================
// Profile Service - API Integration
// จัดการการเรียก API สำหรับ User Profile
// =====================================================

import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { clearAppSession } from '@/utils/authHelper';
import { UserProfile } from '@/global/types';

/** ข้อความ 403 จาก Interceptor — ใช้เช็คเมื่อ API reject แล้วไม่มี response ใน catch */
const FORBIDDEN_MSG = 'ທ່ານບໍ່ໄດ້ຮັບອະນຸຍາດ!!';
function is403Error(err: any): boolean {
  return err?.response?.status === 403 || String(err?.message || '').includes('ບໍ່ໄດ້ຮັບອະນຸຍາດ');
}

/** Whitelist: เฉพาะ Role 1, 2 ດຶງຂໍ້ມູນທົ່ວທຸກຫນ່ວຍ; ອື່ນສົ່ງ selfOnly ໃຫ້ Backend ຈຳກັດແຕ່ຫນ່ວຍງານຕົນເອງ */
function isAdminRole(roleId: number | null | undefined): boolean {
  return roleId === 1 || roleId === 2;
}

/**
 * ດຶງຂໍ້ມູນ User Profile ຈາກ API GET /api/users/[id]
 * รับ id จาก Parameter ที่ส่งมาจาก Store เท่านั้น — ห้ามดึงจาก localStorage ภายในฟังก์ชัน
 * เพื่อให้มั่นใจว่าดึงข้อมูลได้ถูกคนตาม Token ปัจจุบัน (แก้ Data Mismatch).
 * @param id - user id ที่ส่งมาจาก Store (auth.userId) เท่านั้น
 */
export const getUserProfile = async (
  id: string | number
): Promise<UserProfile.UserLoginResponse> => {
  try {
    const idStr = String(id).trim();
    if (!idStr) throw new Error('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ ກະລຸນາ Login ໃໝ່');

    const response = await axiosClientsHelpDesk.get(`users/${idStr}`, {
      params: { _ts: Date.now() },
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
    });

    if (response.status === 200 && response.data) {
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

/** ດຶງລາຍການຝ່າຍ (Department). 403 → clearAppSession + throw (ບໍ່ຄືນ [] ເພື່ອບໍ່ໃຫ້ຜູ້ໃຊ້ທີ່ບໍ່ມີສິດຄາງຢູ່) */
export const getDepartments = async (roleId?: number | null): Promise<UserProfile.Department[]> => {
  try {
    const params: Record<string, string | number> = { _ts: Date.now() };
    if (!isAdminRole(roleId)) params.selfOnly = 'true';
    const response = await axiosClientsHelpDesk.get('departments', {
      params,
    });
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  } catch (err: any) {
    if (is403Error(err)) {
      clearAppSession();
      throw err;
    }
    throw err;
  }
};

/** ດຶງລາຍການພະແນກ (Division). 403 → clearAppSession + throw */
export const getDivisions = async (roleId?: number | null): Promise<UserProfile.Division[]> => {
  try {
    const params: Record<string, string | number> = { _ts: Date.now() };
    if (!isAdminRole(roleId)) params.selfOnly = 'true';
    const response = await axiosClientsHelpDesk.get('divisions', {
      params,
    });
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  } catch (err: any) {
    if (is403Error(err)) {
      clearAppSession();
      throw err;
    }
    throw err;
  }
};

/** ດຶງລາຍການຕຳແໜ່ງ (Position). 403 → clearAppSession + throw */
export const getPositions = async (roleId?: number | null): Promise<UserProfile.Position[]> => {
  try {
    const params: Record<string, string | number> = { _ts: Date.now() };
    if (!isAdminRole(roleId)) params.selfOnly = 'true';
    const response = await axiosClientsHelpDesk.get('positions', {
      params,
    });
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  } catch (err: any) {
    if (is403Error(err)) {
      clearAppSession();
      throw err;
    }
    throw err;
  }
};

/** ດຶງລາຍການรหัสຕຳແໜ່ງ (PositionCode). 403 → clearAppSession + throw */
export const getPositionCodes = async (roleId?: number | null): Promise<UserProfile.PositionCode[]> => {
  try {
    const params: Record<string, string | number> = { _ts: Date.now() };
    if (!isAdminRole(roleId)) params.selfOnly = 'true';
    const response = await axiosClientsHelpDesk.get('positioncodes', {
      params,
    });
    const raw = response.data?.data ?? response.data;
    return Array.isArray(raw) ? raw : [];
  } catch (err: any) {
    if (is403Error(err)) {
      clearAppSession();
      throw err;
    }
    console.error('getPositionCodes error:', err);
    throw err;
  }
};

/**
 * ດຶງຂໍ້ມູນ Master Data (Dropdown Options) ทั้งหมด
 * ຖ້າ roleId ບໍ່ແມ່ນ 1 ຫຼື 2 ຈະສົ່ງ selfOnly=true ໃຫ້ Backend ຈຳກັດແຕ່ຫນ່ວຍງານຕົນເອງ
 */
export const getMasterData = async (roleId?: number | null) => {
  const [departmentsResult, divisionsResult, positionsResult, positionCodesResult] =
    await Promise.allSettled([
      getDepartments(roleId),
      getDivisions(roleId),
      getPositions(roleId),
      getPositionCodes(roleId),
    ]);

  const emptyDepartments: UserProfile.Department[] = [];
  const emptyDivisions: UserProfile.Division[] = [];
  const emptyPositions: UserProfile.Position[] = [];
  const emptyPositionCodes: UserProfile.PositionCode[] = [];

  const toList = <T>(r: PromiseSettledResult<T[]>, empty: T[]): T[] =>
    r.status === 'fulfilled' ? r.value : empty;

  return {
    departments: toList(departmentsResult, emptyDepartments),
    divisions: toList(divisionsResult, emptyDivisions),
    positions: toList(positionsResult, emptyPositions),
    positionCodes: toList(positionCodesResult, emptyPositionCodes),
  };
};
