import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { UserProfile } from '@/global/types';

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
  const emp = user.employee;

  return {
    employeeId: String(user.employeeId ?? emp?.id ?? ''),
    emp_code: emp?.emp_code ?? '',
    first_name: emp?.first_name ?? '',
    last_name: emp?.last_name ?? '',
    fullName: `${emp?.first_name ?? ''} ${emp?.last_name ?? ''}`.trim(),
    tel: emp?.tel || '',
    email: emp?.email || '',
    department_name: emp?.department?.department_name || '',
    division_name: emp?.division?.division_name || '',
    unit_name: emp?.unit?.unit_name || '',
    pos_name: emp?.position?.pos_name || '',
    empimg: emp?.empimg || '',
    gender: emp?.gender ?? '',
    status: emp?.status ?? '',
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
        // =========================================
        setCurrentUser: (user: UserProfile.UserLoginResponse) => {
          if (!user || !user.employee) {
            console.error('setCurrentUser: invalid user object', user);
            return;
          }
          const profileData = mapUserToProfileData(user);
          set({ currentUser: user, profileData, error: null, loading: false });
        },

        // =========================================
        // ดึงข้อมูล Profile ที่มี relations ครบ
        // ถ้า store มีครบ → ใช้เลย
        // ถ้าไม่ครบ → GET /users แล้ว filter หา user ที่ตรงกับ employeeId
        // =========================================
        fetchUserProfile: async () => {
          const { currentUser } = get();

          // ถ้ามี relations ครบ (department_name, division_name ฯลฯ) → ใช้เลย
          if (hasFullRelations(currentUser)) {
            const profileData = mapUserToProfileData(currentUser!);
            set({ profileData, loading: false, error: null });
            return;
          }

          // ถ้า relations ไม่ครบ → ต้องดึงจาก API
          set({ loading: true, error: null });

          try {
            const token = localStorage.getItem('token');
            if (!token) {
              set({ error: 'ກະລຸນາເຂົ້າລະບົບກ່ອນ', loading: false });
              return;
            }

            // ดึง employeeId สำหรับ filter
            const empId = localStorage.getItem('employeeId') ||
              String(currentUser?.employeeId ?? '');
            if (!empId) {
              set({ error: 'ບໍ່ພົບ employeeId ກະລຸນາ Login ໃໝ່', loading: false });
              return;
            }

            // GET /users → คืน list ทั้งหมด (backend ไม่มี /users/:id)
            const response = await axiosClientsHelpDesk.get('users', {
              params: { _ts: Date.now() },
              headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' },
            });

            if (response.status === 200 && response.data) {
              // รองรับ { data: [...] } หรือ [...] ตรง ๆ
              const rawData = response.data?.data ?? response.data;
              const usersList: any[] = Array.isArray(rawData) ? rawData : [];

              // หา user ที่ employeeId ตรงกับของเรา
              const myUser = usersList.find(
                (u: any) => String(u.employeeId) === empId || String(u.id) === empId
              );

              if (myUser && myUser.employee) {
                const userData = myUser as UserProfile.UserLoginResponse;
                const profileData = mapUserToProfileData(userData);

                console.log('✅ fetchUserProfile: found matching user', userData);

                set({
                  currentUser: userData,
                  profileData,
                  loading: false,
                  error: null,
                });
              } else {
                console.error('❌ User not found in /users list. empId:', empId);
                set({
                  error: 'ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ໃນລະບົບ',
                  loading: false,
                });
              }
            } else {
              set({ error: 'ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້', loading: false });
            }
          } catch (error: any) {
            console.error('Error fetching user profile:', error);
            set({
              error: error?.message || 'ບໍ່ສາມາດດຶງຂໍ້ມູນໄດ້',
              loading: false,
            });
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
          } catch (error: any) {
            console.error('Error updating profile:', error);
            set({
              error: error?.message || 'ບໍ່ສາມາດບັນທຶກຂໍ້ມູນໄດ້',
              loading: false,
            });
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
        name: 'userProfileStore',
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
  return profileData?.fullName || 'User';
};
