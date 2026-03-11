import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import { normalizeDataList } from '@/utils/apiNormalizers';
import { getApiErrorMessage } from '@/utils/errorMessage';
import { isAbortError } from '@/utils/abortError';
import type {
  SupportTeamData,
  CreateSupportTeamPayload,
  HeadCategoryData,
  HeadCategorySelectItem,
  CreateHeadCategoryPayload,
  UpdateHeadCategoryPayload,
  DivisionOption,
  RoleSelectItem,
  UserRoleData,
  CreateUserRolePayload,
  UpdateUserRolePayload,
  AdminAssignUser,
} from './types';

/** Map user to role row for Role Management tab */
function mapUserToRoleData(u: AdminAssignUser): UserRoleData {
  const first = u.employee?.first_name ?? '';
  const last = u.employee?.last_name ?? '';
  const userName = `${first} ${last}`.trim() || u.username || String(u.id);
  return {
    id: u.id,
    userId: u.id,
    userName,
    roleId: u.roleId,
    roleName: u.role?.name,
  };
}

function getUsersEndpoint(roleId: number | string | null | undefined): string {
  return Number(roleId) === 2 ? 'users/admin' : 'users';
}

export interface SupportTeamState {
  // Initial state: arrays = [], no null/undefined (avoid "Cannot convert undefined or null to object")
  headCategoryItems: HeadCategoryData[];
  headCategorySelectItems: HeadCategorySelectItem[];
  supportItems: SupportTeamData[];
  divisions: DivisionOption[];
  divisionOptions: { label: string; value: number }[];
  roles: RoleSelectItem[];
  roleOptions: { label: string; value: number }[];
  adminUsers: AdminAssignUser[];
  adminAssignItems: AdminAssignUser[];
  userRoleItems: UserRoleData[];

  loading: boolean;
  loadingHeadCategory: boolean;
  loadingHeadCategorySelect: boolean;
  loadingSupport: boolean;
  loadingDivisions: boolean;
  loadingRoles: boolean;
  loadingAdminUsers: boolean;
  loadingAdminAssign: boolean;
  loadingUserRoles: boolean;
  error: string;
  successMessage: string;

  setError: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
  clearMessages: () => void;

  fetchHeadCategory: (signal?: AbortSignal) => Promise<void>;
  fetchHeadCategorySelect: (signal?: AbortSignal) => Promise<void>;
  fetchSupportTeam: (role?: string, signal?: AbortSignal) => Promise<void>;
  fetchDivisions: (signal?: AbortSignal) => Promise<void>;
  fetchRoles: (signal?: AbortSignal) => Promise<void>;
  fetchAdminUsers: (signal?: AbortSignal) => Promise<void>;
  fetchAdminAssign: (signal?: AbortSignal) => Promise<void>;
  fetchUserRoles: (roleId: number | string | null | undefined, signal?: AbortSignal) => Promise<void>;
  fetchUsers: (roleId: number | string | null | undefined, signal?: AbortSignal) => Promise<void>;

  saveHeadCategory: (payload: CreateHeadCategoryPayload | UpdateHeadCategoryPayload, id?: number) => Promise<boolean>;
  deleteHeadCategory: (id: number) => Promise<void>;
  saveSupportTeam: (payload: CreateSupportTeamPayload, id?: number) => Promise<boolean>;
  deleteSupportTeam: (id: number) => Promise<void>;
  saveAdminAssign: (payload: Record<string, unknown>, id?: number) => Promise<boolean>;
  deleteAdminAssign: (id: number) => Promise<boolean>;
  saveUserRole: (payload: CreateUserRolePayload | UpdateUserRolePayload, id?: number) => Promise<boolean>;
  deleteUserRole: (item: UserRoleData) => Promise<void>;
}

const initialArrays = {
  headCategoryItems: [] as HeadCategoryData[],
  headCategorySelectItems: [] as HeadCategorySelectItem[],
  supportItems: [] as SupportTeamData[],
  divisions: [] as DivisionOption[],
  divisionOptions: [] as { label: string; value: number }[],
  roles: [] as RoleSelectItem[],
  roleOptions: [] as { label: string; value: number }[],
  adminUsers: [] as AdminAssignUser[],
  adminAssignItems: [] as AdminAssignUser[],
  userRoleItems: [] as UserRoleData[],
};

export const useSupportTeamStore = create<SupportTeamState>()(
  devtools(
    (set, get) => ({
      ...initialArrays,
      loading: false,
      loadingHeadCategory: false,
      loadingHeadCategorySelect: false,
      loadingSupport: false,
      loadingDivisions: false,
      loadingRoles: false,
      loadingAdminUsers: false,
      loadingAdminAssign: false,
      loadingUserRoles: false,
      error: '',
      successMessage: '',

      setError: (msg) => set({ error: msg ?? '' }),
      setSuccessMessage: (msg) => set({ successMessage: msg ?? '' }),
      clearMessages: () => set({ error: '', successMessage: '' }),

      fetchHeadCategory: async (signal) => {
        set({ loadingHeadCategory: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('headcategorys', { signal });
          const list = normalizeDataList<HeadCategoryData>(res.data);
          set({ headCategoryItems: list ?? [], loadingHeadCategory: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingHeadCategory: false });
            return;
          }
          set({
            headCategoryItems: [],
            loadingHeadCategory: false,
            error: getApiErrorMessage(e, 'ໂຫຼດຂໍ້ມູນທີມສະໜັບສະໜູນບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchHeadCategorySelect: async (signal) => {
        set({ loadingHeadCategorySelect: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('headcategorys/selectheadcategory', { signal });
          const list = normalizeDataList<HeadCategorySelectItem>(res.data);
          set({ headCategorySelectItems: list ?? [], loadingHeadCategorySelect: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingHeadCategorySelect: false });
            return;
          }
          set({
            headCategorySelectItems: [],
            loadingHeadCategorySelect: false,
            error: getApiErrorMessage(e, 'ໂຫຼດລາຍການເລືອກທີມບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchSupportTeam: async (role = 'SUPPORT', signal) => {
        set({ loadingSupport: true, error: '' });
        try {
          const res = await axiosClientsHelpDesk.get('/support-teams', { params: { role }, signal });
          const list = normalizeDataList<SupportTeamData>(res.data);
          set({ supportItems: list ?? [], loadingSupport: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingSupport: false });
            return;
          }
          set({
            supportItems: [],
            loadingSupport: false,
            error: getApiErrorMessage(e, 'ໂຫຼດທີມສະໜັບສະໜູນບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchDivisions: async (signal) => {
        set({ loadingDivisions: true });
        try {
          const res = await axiosClientsHelpDesk.get('divisions', { signal });
          const data = res.data;
          const list = Array.isArray(data) ? data : (data as { data?: DivisionOption[] })?.data ?? [];
          const divisions = Array.isArray(list) ? list : [];
          set({
            divisions: divisions ?? [],
            divisionOptions: (divisions ?? []).map((d) => ({ label: d.division_name, value: d.id })),
            loadingDivisions: false,
          });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingDivisions: false });
            return;
          }
          set({
            divisions: [],
            divisionOptions: [],
            loadingDivisions: false,
            error: getApiErrorMessage(e, 'ໂຫຼດພະແນກບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchRoles: async (signal) => {
        set({ loadingRoles: true });
        try {
          const res = await axiosClientsHelpDesk.get('roles/selectrole', { signal });
          const list = normalizeDataList<RoleSelectItem>(res.data);
          const roles = list ?? [];
          set({
            roles,
            roleOptions: roles.map((r) => ({ label: r.name, value: r.id })),
            loadingRoles: false,
          });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingRoles: false });
            return;
          }
          set({
            roles: [],
            roleOptions: [],
            loadingRoles: false,
            error: getApiErrorMessage(e, 'ໂຫຼດສະຖານະບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchAdminUsers: async (signal) => {
        set({ loadingAdminUsers: true });
        try {
          const res = await axiosClientsHelpDesk.get('users/admin', { signal });
          const list = normalizeDataList<AdminAssignUser>(res.data);
          set({ adminUsers: list ?? [], loadingAdminUsers: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingAdminUsers: false });
            return;
          }
          set({
            adminUsers: [],
            loadingAdminUsers: false,
            error: getApiErrorMessage(e, 'ໂຫຼດລາຍຊື່ພະນັກງານບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchAdminAssign: async (signal) => {
        set({ loadingAdminAssign: true });
        try {
          const res = await axiosClientsHelpDesk.get('users/adminassign', { signal });
          const list = normalizeDataList<AdminAssignUser>(res.data);
          set({ adminAssignItems: list ?? [], loadingAdminAssign: false });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingAdminAssign: false });
            return;
          }
          set({
            adminAssignItems: [],
            loadingAdminAssign: false,
            error: getApiErrorMessage(e, 'ໂຫຼດລາຍການມອບໝາຍບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchUserRoles: async (roleId, signal) => {
        if (Number(roleId) !== 1 && Number(roleId) !== 2) {
          set({ userRoleItems: [] });
          return;
        }
        set({ loadingUserRoles: true });
        try {
          const endpoint = getUsersEndpoint(roleId);
          const res = await axiosClientsHelpDesk.get<AdminAssignUser[]>(endpoint, { signal });
          const list = normalizeDataList<AdminAssignUser>(res.data);
          set({
            userRoleItems: (list ?? []).map(mapUserToRoleData),
            loadingUserRoles: false,
          });
        } catch (e) {
          if (isAbortError(e)) {
            set({ loadingUserRoles: false });
            return;
          }
          set({
            userRoleItems: [],
            loadingUserRoles: false,
            error: getApiErrorMessage(e, 'ໂຫຼດສະຖານະພະນັກງານບໍ່ສຳເລັດ'),
          });
        }
      },

      fetchUsers: async (roleId, signal) => {
        if (Number(roleId) === 1) {
          set({ loadingAdminUsers: true });
          try {
            const res = await axiosClientsHelpDesk.get('users', { signal });
            const list = normalizeDataList<AdminAssignUser>(res.data);
            set({ adminUsers: list ?? [], loadingAdminUsers: false });
          } catch (e) {
            if (isAbortError(e)) {
              set({ loadingAdminUsers: false });
              return;
            }
            set({
              adminUsers: [],
              loadingAdminUsers: false,
              error: getApiErrorMessage(e, 'ໂຫຼດລາຍຊື່ພະນັກງານບໍ່ສຳເລັດ'),
            });
          }
        } else {
          get().fetchAdminUsers(signal);
        }
      },

      saveHeadCategory: async (payload, id) => {
        set({ error: '' });
        try {
          if (id != null) {
            await axiosClientsHelpDesk.put(`headcategorys/${id}`, payload);
          } else {
            await axiosClientsHelpDesk.post('headcategorys', payload);
          }
          set({ successMessage: id != null ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
          await get().fetchHeadCategory();
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteHeadCategory: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`headcategorys/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchHeadCategory();
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },

      saveSupportTeam: async (payload, id) => {
        set({ error: '' });
        try {
          const params = { role: 'SUPPORT' };
          if (id != null) {
            await axiosClientsHelpDesk.put(`/support-teams/${id}`, { ...payload });
          } else {
            await axiosClientsHelpDesk.post('/support-teams', { ...payload, ...params });
          }
          set({ successMessage: id != null ? 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' : 'ເພີ່ມຂໍ້ມູນສຳເລັດ' });
          await get().fetchSupportTeam('SUPPORT');
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteSupportTeam: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`/support-teams/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchSupportTeam('SUPPORT');
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },

      saveAdminAssign: async (payload, id) => {
        set({ error: '' });
        try {
          if (id != null) {
            await axiosClientsHelpDesk.put(`users/adminassign/${id}`, payload);
          } else {
            await axiosClientsHelpDesk.post('users/adminassign', payload);
          }
          await get().fetchAdminAssign();
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteAdminAssign: async (id) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`users/adminassign/${id}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchAdminAssign();
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
          return false;
        }
      },

      saveUserRole: async (payload, _id) => {
        set({ error: '' });
        try {
          const userId = payload.userId;
          await axiosClientsHelpDesk.put(`users/${userId}`, {
            roleId: payload.roleId,
            ...(payload.description != null && payload.description !== ''
              ? { description: payload.description }
              : {}),
          });
          set({ successMessage: 'ແກ້ໄຂຂໍ້ມູນສຳເລັດ' });
          await get().fetchUserRoles(payload.userId);
          return true;
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ') });
          return false;
        }
      },

      deleteUserRole: async (item) => {
        set({ error: '' });
        try {
          await axiosClientsHelpDesk.delete(`users/${item.userId}`);
          set({ successMessage: 'ລຶບຂໍ້ມູນສຳເລັດ' });
          await get().fetchUserRoles(item.roleId);
        } catch (e: unknown) {
          set({ error: getApiErrorMessage(e, 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ') });
        }
      },
    }),
    { name: 'HelpdeskSupportTeam' }
  )
);
