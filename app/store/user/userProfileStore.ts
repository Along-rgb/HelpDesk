import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axiosClientsHelpDesk, { getTokenFromStorage } from '@/config/axiosClientsHelpDesk';
import { AUTH_KEYS, clearAppSession } from '@/utils/authHelper';
import { UserProfile } from '@/global/types';
import { authenStore } from './loginAuthStore';

// =====================================================
// User Profile Store - Clean Architecture
// =====================================================

interface UserProfileState {
  loading: boolean;
  error: string | null;
  currentUser: UserProfile.UserLoginResponse | null;
  profileData: UserProfile.ProfileDisplayData | null;

  setCurrentUser: (user: UserProfile.UserLoginResponse) => void;
  fetchUserProfile: () => Promise<void>;
  updateProfile: (data: UserProfile.UpdateProfileRequest) => Promise<void>;
  clearProfile: () => void;
}

/**
 * Helper: แปลง UserLoginResponse → ProfileDisplayData
 */
const mapUserToProfileData = (
  user: UserProfile.UserLoginResponse
): UserProfile.ProfileDisplayData => {
  const emp = user.employee as (UserProfile.Employee & Record<string, unknown>) | undefined;
  const firstName = emp?.first_name ?? (emp?.firstName as string) ?? '';
  const lastName = emp?.last_name ?? (emp?.lastName as string) ?? '';

  return {
    employeeId: String(user.employeeId ?? emp?.id ?? ''),
    emp_code: (emp?.emp_code ?? '') as string,
    first_name: firstName,
    last_name: lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    tel: (emp?.tel ?? '') as string,
    email: (emp?.email ?? '') as string,
    department_name: (emp?.department as { department_name?: string })?.department_name ?? '',
    division_name: (emp?.division as { division_name?: string })?.division_name ?? '',
    unit_name: (emp?.unit as { unit_name?: string })?.unit_name ?? '',
    pos_name: (emp?.position as { pos_name?: string })?.pos_name ?? '',
    empimg: (emp?.empimg ?? '') as string,
    gender: (emp?.gender ?? '') as string,
    status: (emp?.status ?? '') as string,
  };
};

/**
 * เช็คว่า user object มี relations ครบหรือไม่
 * (department, division, unit, position nested objects)
 */
const hasFullRelations = (user: UserProfile.UserLoginResponse | null): boolean => {
  if (!user?.employee) return false;
  const emp = user.employee;
  return !!(
    emp.department?.department_name &&
    emp.division?.division_name &&
    emp.position?.pos_name
  );
};

/** รองรับ API ที่ส่ง snake_case (department_id, first_name) หรือ nested ไม่ครบ */
type RawEmployee = Record<string, unknown> & {
  id?: number;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  emp_code?: string;
  tel?: string;
  email?: string | null;
  departmentId?: number;
  department_id?: number;
  divisionId?: number;
  division_id?: number;
  posId?: number;
  pos_id?: number;
  department?: UserProfile.Department;
  division?: UserProfile.Division;
  position?: UserProfile.Position;
  unit?: UserProfile.Unit;
};

/**
 * แปลงข้อมูลจาก API ให้ตรงกับโครงสร้างที่ใช้ใน store/ฟอร์ม
 * รองรับทั้ง snake_case (department_id) และ camelCase (departmentId)
 * และทั้ง response ที่เป็น { user, employee } หรือ { employee } ตรง ๆ
 */
function normalizeUserResponse(raw: unknown): UserProfile.UserLoginResponse | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  let employee = (obj.employee ?? obj) as RawEmployee;
  if (!employee || typeof employee !== 'object') return null;

  const empId = Number(employee.id ?? obj.employeeId ?? obj.employee_id ?? 0);
  const userId = Number(obj.id ?? obj.userId ?? empId);
  const employeeId = Number(obj.employeeId ?? obj.employee_id ?? empId);

  const departmentId = employee.departmentId ?? employee.department_id ?? employee.department?.id;
  const divisionId = employee.divisionId ?? employee.division_id ?? employee.division?.id;
  const posId = employee.posId ?? employee.pos_id ?? employee.position?.id;

  const normalizedEmployee: UserProfile.Employee = {
    id: empId,
    first_name: (employee.first_name ?? employee.firstName ?? '') as string,
    last_name: (employee.last_name ?? employee.lastName ?? '') as string,
    emp_code: (employee.emp_code ?? '') as string,
    status: (employee.status ?? '') as string,
    gender: (employee.gender ?? '') as string,
    tel: (employee.tel ?? '') as string,
    email: employee.email ?? null,
    empimg: (employee.empimg ?? '') as string,
    posId: posId ?? 0,
    departmentId: departmentId ?? 0,
    divisionId: divisionId ?? 0,
    officeId: (() => {
      const v = employee.officeId ?? employee.office_id;
      return typeof v === 'number' ? v : null;
    })(),
    unitId: Number(employee.unitId ?? employee.unit_id ?? 0),
    createdAt: String(employee.createdAt ?? employee.created_at ?? ''),
    updatedAt: String(employee.updatedAt ?? employee.updated_at ?? ''),
    department: (employee.department as UserProfile.Department) ?? ({} as UserProfile.Department),
    division: (employee.division as UserProfile.Division) ?? ({} as UserProfile.Division),
    office: (employee.office as UserProfile.Office | null) ?? null,
    unit: (employee.unit as UserProfile.Unit) ?? ({} as UserProfile.Unit),
    position: (employee.position as UserProfile.Position) ?? ({} as UserProfile.Position),
  };

  const user: UserProfile.UserLoginResponse = {
    id: userId,
    username: (obj.username ?? '') as string,
    employeeId,
    roleId: (obj.roleId ?? obj.role_id ?? 0) as number,
    role: (obj.role as UserProfile.Role) ?? ({} as UserProfile.Role),
    employee: normalizedEmployee,
  };

  return user;
}

export const useUserProfileStore = create<UserProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        loading: false,
        error: null,
        currentUser: null,
        profileData: null,

        // =========================================
        // เก็บ user object เข้า store (จาก login หรือ API)
        // normalize ให้โครงสร้างตรงกันก่อนบันทึก
        // =========================================
        setCurrentUser: (user: UserProfile.UserLoginResponse) => {
          const normalized = normalizeUserResponse(user as unknown);
          if (!normalized?.employee) return;
          const profileData = mapUserToProfileData(normalized);
          set({ currentUser: normalized, profileData, error: null, loading: false });
        },

        // =========================================
        // ดึงข้อมูล Profile: เมื่อมีการ login ให้นำ id ของ user ที่ login (auth.userId)
        // มาเรียก GET /api/users/[id] แล้วดึงข้อมูลมาแสดงตามที่วางไว้
        // ถ้า store มี relations ครบ → ใช้เลย; ไม่ครบหรือ currentUser เป็น null → เรียก API
        // =========================================
        fetchUserProfile: async () => {
          const { currentUser } = get();

          if (hasFullRelations(currentUser)) {
            const profileData = mapUserToProfileData(currentUser!);
            set({ profileData, loading: false, error: null });
            return;
          }

          set({ loading: true, error: null });

          try {
            const token = getTokenFromStorage();
            if (!token) {
              set({ error: 'ກະລຸນາເຂົ້າລະບົບກ່ອນ', loading: false });
              return;
            }

            const auth = authenStore.getState().authData;
            const userId = auth?.userId != null ? String(auth.userId) : null;
            const empId = String(
              currentUser?.employeeId ??
                currentUser?.employee?.id ??
                auth?.employeeId ??
                ''
            );

            if (!empId && !userId) {
              set({ error: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ ກະລຸນາ Login ໃໝ່', loading: false });
              clearAppSession();
              return;
            }

            let userData: UserProfile.UserLoginResponse | null = null;
            const idsToTry = userId ? [userId, empId].filter(Boolean) : [empId];

            for (const id of idsToTry) {
              if (!id) continue;
              try {
                const byIdRes = await axiosClientsHelpDesk.get(`users/${id}`, {
                  params: { _ts: Date.now() },
                  headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
                });
                if (byIdRes.status === 200 && byIdRes.data) {
                  const raw = byIdRes.data?.data ?? byIdRes.data;
                  const normalized = normalizeUserResponse(raw);
                  if (normalized?.employee) {
                    userData = normalized;
                    break;
                  }
                }
              } catch {
                continue;
              }
            }

            if (!userData) {
              const response = await axiosClientsHelpDesk.get('users', {
                params: { _ts: Date.now() },
                headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
              });

              if (response.status === 200 && response.data) {
                const rawData = response.data?.data ?? response.data;
                const rawList = Array.isArray(rawData) ? rawData : [];
                for (const item of rawList) {
                  const u = normalizeUserResponse(item);
                  if (
                    u?.employee &&
                    (String(u.employeeId) === empId ||
                      String(u.employee?.id) === empId ||
                      String(u.id) === empId)
                  ) {
                    userData = u;
                    break;
                  }
                }
              }
            }

            const idMatches =
              userData?.employee &&
              (String(userData.employeeId) === empId ||
                String(userData.employee.id) === empId ||
                (userId != null && String((userData as { id?: number }).id) === userId));
            if (idMatches && userData?.employee) {
              const profileData = mapUserToProfileData(userData);
              set({
                currentUser: userData,
                profileData,
                loading: false,
                error: null,
              });
            } else {
              set({
                error: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ໃນລະບົບ',
                loading: false,
              });
              clearAppSession();
            }
          } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
            const message =
              err?.response?.data?.message ||
              (err instanceof Error ? err.message : null) ||
              (err?.response?.status === 403 ? 'ບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນ' : 'ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້');
            console.error('[profileUser] fetchUserProfile error:', message, 'status:', err?.response?.status);
            set({ error: message, loading: false });
          }
        },

        // =========================================
        // อัพเดท Profile
        // =========================================
        updateProfile: async (data: UserProfile.UpdateProfileRequest) => {
          set({ loading: true, error: null });
          try {
            const response = await axiosClientsHelpDesk.put('users/update', data);
            if (response.status === 200) {
              await get().fetchUserProfile();
            }
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້';
            set({ error: message, loading: false });
            throw error;
          }
        },

        // =========================================
        // Clear Profile (Logout)
        // =========================================
        clearProfile: () => {
          set({
            loading: false,
            error: null,
            currentUser: null,
            profileData: null,
          });
        },
      }),
      {
        name: AUTH_KEYS.USER_PROFILE_STORE,
        partialize: (state) => ({
          currentUser: state.currentUser,
          profileData: state.profileData,
        }),
      }
    ),
    { name: 'UserProfile' }
  )
);

// =====================================================
// Selectors
// =====================================================

export const useProfileData = () => {
  const profileData = useUserProfileStore((state) => state.profileData);
  const loading = useUserProfileStore((state) => state.loading);
  const error = useUserProfileStore((state) => state.error);
  return { profileData, loading, error };
};

export const useDisplayName = () => {
  const profileData = useUserProfileStore((state) => state.profileData);
  const currentUser = useUserProfileStore((state) => state.currentUser);
  if (profileData?.fullName) return profileData.fullName;
  const emp = currentUser?.employee as { first_name?: string; last_name?: string } | undefined;
  if (emp?.first_name || emp?.last_name) {
    return `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
  }
  return 'User';
};
