// src/uikit/MenuApps/Detail-category_SupportTeam/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import SupportTeamCreateDialog from './SupportTeamCreateDialog';
import SupportTeamTable from './SupportTeamTable';
import HeadCategoryCreateDialog from './HeadCategoryCreateDialog';
import RoleManagementTable from './RoleManagementTable';
import StaffTable from './StaffTable';
import RoleAssignDialog from './RoleAssignDialog';
import { useSupportTeam } from '../hooks/useSupportTeam';
import { useHeadCategory } from '../hooks/useHeadCategory';
import { useHeadCategorySelect } from '../hooks/useHeadCategorySelect';
import { useAdminAssignUsers } from '../hooks/useAdminAssignUsers';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useUsers } from '../hooks/useUsers';
import { useDivisions } from '../hooks/useDivisions';
import { useRoles } from '../hooks/useRoles';
import { useUserRoles } from '../hooks/useUserRoles';
import { SupportTeamData, CreateSupportTeamPayload, HeadCategoryData, SupportTeamTabs, SupportTeamTechnicalRow, UserRoleData, AdminAssignUser } from '../types';
import type { HeadCategorySavePayload } from './HeadCategoryCreateDialog';
import type { RoleAssignSavePayload } from './RoleAssignDialog';
import StaffRoleEditDialog, { type StaffRoleSavePayload } from './StaffRoleEditDialog';
import { getRoleDisplayName } from './roleDisplayNames';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';
import { useUserProfile } from '@/types/useUserProfile';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';

/** tabIndex 0 = ທິມສະໜັບສະໜູນ, 1 = ວິຊາການ, 2 = ສະຖານະ (disabled), 3 = ພະນັກງານ. */
const ALL_TAB_ITEMS = [
    { label: 'ທິມສະໜັບສະໜູນ', tabIndex: SupportTeamTabs.ISSUE_CATEGORY },
    { label: 'ວິຊາການ', tabIndex: SupportTeamTabs.TECHNICAL },
    { label: 'ສະຖານະ', tabIndex: SupportTeamTabs.ROLE_MANAGEMENT },
    { label: 'ພະນັກງານ', tabIndex: SupportTeamTabs.STAFF },
] as const;

/** Role 1: ທິມສະໜັບສະໜູນ only (full GET/POST /api/headcategorys). Role 2: ວິຊາການ only (GET /api/headcategorys/selectheadcategory only). */
const isRole2 = (r: number | string | null | undefined) => Number(r) === 2;
const isRole1 = (r: number | string | null | undefined) => Number(r) === 1;

export default function SupportTeamPage() {
    const searchParams = useSearchParams();
    const { roleId, divisionId: userDivisionId, departmentId: userDepartmentId } = useUserProfile();
    const [activeIndex, setActiveIndex] = useState(0);

    /** Only run API hooks when profile is loaded and user has access (Role 1 or 2) to avoid Forbidden on initial load */
    const profileReady = roleId === 1 || roleId === 2;
    const canAccessTechnical = isRole2(roleId);
    /** Role 1 only: full CRUD on /api/headcategorys (nested department/division). Role 2 must NOT call it (403). */
    const canAccessFullHeadCategory = isRole1(roleId);

    /** Default tab ตาม role: Role 1 = ທິມສະໜັບສະໜູນ (0), Role 2 = ວິຊາການ (1). Tab ສະຖານະ (2) ໃຫ້ທັງສອງ role. */
    const defaultTabIndex = useMemo(() => (canAccessFullHeadCategory ? SupportTeamTabs.ISSUE_CATEGORY : SupportTeamTabs.TECHNICAL), [canAccessFullHeadCategory]);

    const { toast: headCategoryToast, items: headCategoryItems, loading: headCategoryLoading, saveData: saveHeadCategory, deleteData: deleteHeadCategory, fetchData: fetchHeadCategory } = useHeadCategory(
        0,
        profileReady && canAccessFullHeadCategory && activeIndex === SupportTeamTabs.ISSUE_CATEGORY
    );
    const { options: divisionOptions, divisions } = useDivisions(profileReady && isRole1(roleId));
    /** Role 1 only: GET /support-teams เมื่ออยู่ tab ວິຊາການເທົ່ານັ້ນ. */
    const { toast: supportToast, items: supportItems, loading: supportTeamLoading, saveData: saveSupport, deleteData: deleteSupport, fetchData: fetchSupportTeam } = useSupportTeam(
        activeIndex,
        profileReady && isRole1(roleId) && activeIndex === SupportTeamTabs.TECHNICAL
    );
    /** Role 2: ໃຊ້ tab 0 (ສະແດງລາຍການ) + tab 1 (ວິຊາການ). ບໍ່ເອີ້ນເມື່ອຢູ່ tab ສະຖານະ. */
    const { items: headCategorySelectItems, loading: headCategorySelectLoading, fetchData: fetchHeadCategorySelect } = useHeadCategorySelect(
        activeIndex,
        profileReady && canAccessTechnical && activeIndex <= 1
    );
    /** Role 2 ເທົ່ານັ້ນ, ເມື່ອຢູ່ tab ວິຊາການ. */
    const { items: adminAssignItems, loading: adminAssignLoading, fetchData: fetchAdminAssign, saveData: saveAdminAssign, deleteData: deleteAdminAssign } = useAdminAssignUsers(
        activeIndex,
        profileReady && canAccessTechnical && activeIndex === SupportTeamTabs.TECHNICAL
    );
    /** Role 1: GET /api/users. Role 2: GET /api/users/admin. ເອີ້ນແຕ່ Hook ທີ່ກົງກັບ role ເພື່ອຫຼີກເວັ້ນ 403. Tab ພະນັກງານ (STAFF) ໃຊ້ລາຍຊື່ຜູ້ໃຊ້ເຊັ່ນກັນ. */
    const needUserList = (canAccessTechnical && activeIndex === SupportTeamTabs.TECHNICAL) || activeIndex === SupportTeamTabs.ROLE_MANAGEMENT || activeIndex === SupportTeamTabs.STAFF;
    const { items: usersItems, loading: usersLoading, fetchData: fetchUsers } = useUsers(
        activeIndex,
        profileReady && isRole1(roleId) && needUserList
    );
    const { items: adminUsersItems, loading: adminUsersLoading, fetchData: fetchAdminUsers } = useAdminUsers(
        activeIndex,
        profileReady && isRole2(roleId) && needUserList
    );
    const adminUsers = isRole1(roleId) ? usersItems : adminUsersItems;
    const fetchAdminUsersRef = isRole1(roleId) ? fetchUsers : fetchAdminUsers;
    const { options: roleOptions, fetchData: fetchRoles } = useRoles(profileReady && (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT || activeIndex === SupportTeamTabs.STAFF));
    /** Role 1 ແລະ Role 2 ເຂົ້າໃຊ້ tab ສະຖານະ (Role Management). ດຶງຂໍ້ມູນຈາກ /api/users ຫຼື /api/users/admin ຕາມ API.md (ບໍ່ມີ /api/user-roles). */
    const { toast: userRolesToast, items: userRoleItems, loading: userRolesLoading, saveData: saveUserRole, deleteData: deleteUserRole, fetchData: fetchUserRoles } = useUserRoles(
        roleId,
        profileReady && activeIndex === SupportTeamTabs.ROLE_MANAGEMENT
    );

    /** Role 1: full list from GET /api/headcategorys (nested department/division). Role 2: list from GET /api/headcategorys/selectheadcategory (departmentId/divisionId only), filtered by division. */
    const headCategoryItemsForDisplay = useMemo((): HeadCategoryData[] => {
        if (isRole1(roleId)) {
            const list = Array.isArray(headCategoryItems) ? headCategoryItems : [];
            return list.map((h) => ({ ...h, description: h.description ?? '' })) as HeadCategoryData[];
        }
        const list = Array.isArray(headCategorySelectItems) ? headCategorySelectItems : [];
        const normalized = list.map((h) => ({ ...h, description: h.description ?? '' })) as HeadCategoryData[];
        if (userDivisionId != null) return normalized.filter((h) => h.divisionId === userDivisionId);
        return normalized;
    }, [roleId, headCategoryItems, headCategorySelectItems, userDivisionId]);

    const toast = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryToast : activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? userRolesToast : supportToast;
    const items = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? userRoleItems : supportItems;

    /** loading ຂອງ tab ປັດຈຸບັນ — ບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນເປີດໜ້າ/refresh ຫຼື ຍັງໂຫຼດຂໍ້ມູນ */
    const tableLoading = useMemo(() => {
        if (!profileReady) return true; // ຍັງບໍ່ຮູ້ role — ບໍ່ໃຫ້ແສງ empty
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return headCategoryLoading;
        if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) return userRolesLoading;
        if (activeIndex === SupportTeamTabs.STAFF) return isRole1(roleId) ? usersLoading : adminUsersLoading;
        return isRole1(roleId) ? supportTeamLoading : (headCategorySelectLoading || adminAssignLoading);
    }, [profileReady, activeIndex, roleId, headCategoryLoading, userRolesLoading, supportTeamLoading, headCategorySelectLoading, adminAssignLoading, usersLoading, adminUsersLoading]);

    const issueCategoryMap = useMemo(() => createDataMap(headCategoryItemsForDisplay, 'id', 'name'), [headCategoryItemsForDisplay]);

    /** แถวสำหรับ tab ວິຊາການ: หัวข้อ section ຈາກ headcategorys/selectheadcategory (name), ຜູ້ໃຊ້ຈາກ users/adminassign ແຕ່ roleId=3 (Staff) ກົງກັບ departmentId/divisionId ເທົ່ານັ້ນ. */
    const STAFF_ROLE_ID = 3;
    const technicalTabRows = useMemo((): SupportTeamTechnicalRow[] => {
        const rows: SupportTeamTechnicalRow[] = [];
        let headList = Array.isArray(headCategorySelectItems) ? headCategorySelectItems : [];
        if (canAccessTechnical && userDepartmentId != null) {
            const filtered = headList.filter((h) => h.departmentId === userDepartmentId);
            if (filtered.length > 0) headList = filtered;
        }
        const userList = Array.isArray(adminAssignItems)
            ? adminAssignItems.filter((u) => Number(u.roleId) === STAFF_ROLE_ID)
            : [];
        const addedUserIds = new Set<number>();

        for (const head of headList) {
            const headDeptId = head.departmentId;
            const headDivId = head.divisionId;
            const usersInSection = userList.filter((u) => {
                if (addedUserIds.has(u.id)) return false;
                const uDeptId = u.employee?.departmentId ?? u.employee?.department?.id;
                const uDivId = u.employee?.divisionId ?? u.employee?.division?.id;
                const matchDept = headDeptId != null && uDeptId != null && uDeptId === headDeptId;
                const matchDiv = headDivId != null && uDivId != null && uDivId === headDivId;
                return matchDept || matchDiv;
            });
            rows.push({ type: 'section', headCategoryId: head.id, name: head.name, divisionId: head.divisionId, departmentId: head.departmentId });
            for (const u of usersInSection) {
                addedUserIds.add(u.id);
                const first = u.employee?.first_name ?? '';
                const last = u.employee?.last_name ?? '';
                rows.push({
                    type: 'user',
                    id: u.id,
                    fullName: `${first} ${last}`.trim() || u.username || '-',
                    divisionId: u.employee?.divisionId ?? 0,
                    departmentId: u.employee?.departmentId ?? u.employee?.department?.id,
                    raw: u,
                });
            }
        }
        return rows;
    }, [headCategorySelectItems, adminAssignItems, canAccessTechnical, userDepartmentId]);

    /** ตัวเลือกທີມສະໜັບສະໜູນ (tab ວິຊາການ): ໃຊ້ departmentId — Role 2 เห็นเฉพาะ head ที่ departmentId ตรงกับตนเอง */
    const headCategoryTeamOptions = useMemo(() => {
        const list = Array.isArray(headCategorySelectItems) ? headCategorySelectItems : [];
        const filtered =
            userDepartmentId != null && canAccessTechnical
                ? list.filter((h) => h.departmentId === userDepartmentId)
                : list;
        return filtered.map((h) => ({ label: h.name, value: h.id }));
    }, [headCategorySelectItems, userDepartmentId, canAccessTechnical]);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    /** ຊ່ອງຄົ້ນຫາແຍກຕໍ່ tab — tab 0,1,2,3 ເປັນຄົນລະຂໍ້ມູນ */
    const [globalFilterByTab, setGlobalFilterByTab] = useState<Record<number, string>>({});
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | HeadCategoryData | UserRoleData | AdminAssignUser | null>(null);
    /** Tab ພະນັກງານ: ອັບເດດສະຖານະຫຼັງບັນທຶກໂດຍບໍ່ refetch — ບໍ່ໃຫ້ load ຂໍ້ມູນໃໝ່ທຸກຄັ້ງ */
    const [staffRoleOverrides, setStaffRoleOverrides] = useState<Record<number, { roleId: number; roleName: string }>>({});

    /** Tab ພະນັກງານ: ລາຍຊື່ຜູ້ໃຊ້ທີ່ອັບເດດສະຖານະຫຼັງບັນທຶກ (optimistic) ໂດຍບໍ່ refetch */
    const staffTableItems = useMemo((): AdminAssignUser[] => {
        const list = Array.isArray(adminUsers) ? adminUsers : [];
        if (Object.keys(staffRoleOverrides).length === 0) return list;
        return list.map((u) => {
            const o = staffRoleOverrides[u.id];
            if (!o) return u;
            return { ...u, roleId: o.roleId, role: { id: o.roleId, name: o.roleName, description: u.role?.description ?? '' } };
        });
    }, [adminUsers, staffRoleOverrides]);

    /** Role 1: ວິຊາການ (tab 1) disabled. Role 2: ທິມສະໜັບສະໜູນ (tab 0) disabled. Tab ສະຖານະ (tab 2) disabled. */
    const tabItems = useMemo(() => [...ALL_TAB_ITEMS], []);

    const tabMenuModel = useMemo(() => tabItems.map((t) => ({
        label: t.label,
        disabled:
            t.tabIndex === SupportTeamTabs.ROLE_MANAGEMENT ||
            (isRole1(roleId) && t.tabIndex === SupportTeamTabs.TECHNICAL) ||
            (isRole2(roleId) && t.tabIndex === SupportTeamTabs.ISSUE_CATEGORY),
    })), [tabItems, roleId]);

    const config = useMemo(() => {
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return { header: 'ການຈັດການທີມສະໜັບສະໜູນ', dialogHeader: 'ເພີ່ມທີມສະໜັບສະໜູນ', label: 'ຊື່ທີມສະໜັບສະໜູນ' };
        if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) return { header: 'ການຈັດການສະຖານະ', dialogHeader: 'ເພີ່ມສະຖານະ', label: 'ສະຖານະ' };
        if (activeIndex === SupportTeamTabs.STAFF) return { header: 'ການຈັດການພະນັກງານ', dialogHeader: 'ເພີ່ມພະນັກງານ', label: 'ພະນັກງານ' };
        return { header: 'ການຈັດການວິຊາການ', dialogHeader: 'ເພີ່ມວິຊາການ', label: 'ຊື່ວິຊາການ' };
    }, [activeIndex]);

    /** index สำหรับ TabMenu (ลำดับใน tabItems ที่กรองแล้ว) */
    const menuActiveIndex = tabItems.findIndex((t) => t.tabIndex === activeIndex);
    const safeMenuActiveIndex = menuActiveIndex >= 0 ? menuActiveIndex : 0;

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        const requested = tabParam != null && tabParam !== '' ? Number(tabParam) : null;
        if (requested != null && !Number.isNaN(requested) && requested >= 0 && requested < tabItems.length) {
            const blockTab1 = isRole1(roleId) && requested === SupportTeamTabs.TECHNICAL;
            const blockTab0 = isRole2(roleId) && requested === SupportTeamTabs.ISSUE_CATEGORY;
            const tab2Disabled = requested === SupportTeamTabs.ROLE_MANAGEMENT;
            if (tab2Disabled) setActiveIndex(SupportTeamTabs.STAFF);
            else if (!blockTab1 && !blockTab0) setActiveIndex(requested);
            else setActiveIndex(defaultTabIndex);
        } else if (profileReady) {
            setActiveIndex(defaultTabIndex);
        }
        if (isRole1(roleId)) {
            setActiveIndex((prev) => (prev === SupportTeamTabs.TECHNICAL ? SupportTeamTabs.ISSUE_CATEGORY : prev));
        }
        if (isRole2(roleId)) {
            setActiveIndex((prev) => (prev === SupportTeamTabs.ISSUE_CATEGORY ? SupportTeamTabs.TECHNICAL : prev));
        }
        setActiveIndex((prev) => (prev === SupportTeamTabs.ROLE_MANAGEMENT ? SupportTeamTabs.STAFF : prev));
    }, [searchParams, roleId, profileReady, defaultTabIndex, tabItems.length]);
    /** ຕາຕະລາງສະຖານະ: ຕົວເລືອກຜູ້ໃຊ້ຈາກ adminUsers (Role 1 = /api/users, Role 2 = /api/users/admin). Label = [username] first_name last_name ເພື່ອຄົ້ນຫາດ້ວຍລະຫັດພະນັກງານ. */
    const userOptionsForRoleTab = useMemo(() => {
        const list = Array.isArray(adminUsers) ? adminUsers : [];
        return list.map((u) => {
            const first = u.employee?.first_name ?? '';
            const last = u.employee?.last_name ?? '';
            const namePart = `${first} ${last}`.trim();
            const label = namePart ? `[${u.username}] ${namePart}` : `[${u.username}]`;
            return { label, value: u.id };
        });
    }, [adminUsers]);
    /** ຕົວເລືອກສະຖານະ: ໃຊ້ໃນການເພີ່ມສະຖານະ — ບໍ່ໃຫ້ເລືອກ role 1, ແສງຊື່ພາສາລາວ */
    const roleOptionsForRoleTab = useMemo(() => {
        return roleOptions
            .filter((o) => o.value !== 1)
            .map((r) => ({ value: r.value, label: getRoleDisplayName(r.value) || r.label }));
    }, [roleOptions]);
    /** ຕົວເລືອກສະຖານະສຳລັບ tab ພະນັກງານ — ແສງຊື່ພາສາລາວ (ແອັດມິນ, ວິຊາການ, ເປັນຜູ້ໃຊ້ງານ) */
    const staffRoleOptions = useMemo(
        () => roleOptions.map((r) => ({ value: r.value, label: getRoleDisplayName(r.value) || r.label })),
        [roleOptions]
    );

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: SupportTeamData | HeadCategoryData | UserRoleData | AdminAssignUser) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSaveHeadCategory = async (payload: HeadCategorySavePayload) => {
        setSaving(true);
        const id = selectedItem && 'divisionId' in selectedItem ? selectedItem.id : undefined;
        const success = await saveHeadCategory(payload, id);
        if (success) {
            setDialogVisible(false);
            if (isRole1(roleId)) {
                await fetchHeadCategory();
            }
            await Promise.all([
                ...(isRole2(roleId) ? [fetchHeadCategorySelect()] : []),
                fetchSupportTeam(),
                fetchAdminUsersRef(),
            ].filter(Boolean));
        }
        setSaving(false);
    };
    const handleSaveRoleAssign = async (payload: RoleAssignSavePayload) => {
        setSaving(true);
        const id = selectedItem && 'roleId' in selectedItem && 'userId' in selectedItem ? (selectedItem as UserRoleData).id : undefined;
        const success = await saveUserRole(payload, id);
        if (success) {
            setDialogVisible(false);
            await Promise.all([fetchUserRoles(), fetchRoles(), fetchAdminUsersRef()]);
        }
        setSaving(false);
    };

    /** Tab ພະນັກງານ: ແກ້ໄຂສະຖານະເທົ່ານັ້ນ — PUT /api/users/[id]. ບໍ່ refetch ຂໍ້ມູນ, ໃຊ້ optimistic update ເພື່ອບໍ່ໃຫ້ load ໃໝ່ທຸກຄັ້ງ */
    const handleSaveStaffRole = async (payload: StaffRoleSavePayload) => {
        setSaving(true);
        try {
            await axiosClientsHelpDesk.put(`users/${payload.userId}`, { roleId: payload.roleId });
            const roleName = (getRoleDisplayName(payload.roleId) || roleOptions.find((r) => r.value === payload.roleId)?.label) ?? '';
            setStaffRoleOverrides((prev) => ({ ...prev, [payload.userId]: { roleId: payload.roleId, roleName } }));
            supportToast.current?.show({ severity: 'success', summary: 'Success', detail: 'ແກ້ໄຂສະຖານະສຳເລັດ' });
            setDialogVisible(false);
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            const detail = typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ';
            supportToast.current?.show({ severity: 'error', summary: 'Error', detail, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSupport = async (payload: CreateSupportTeamPayload) => {
        setSaving(true);
        const id = selectedItem && 'id' in selectedItem ? selectedItem.id : undefined;
        const success = isRole2(roleId)
            ? await saveAdminAssign(payload as unknown as Record<string, unknown>, id)
            : await saveSupport(payload, selectedItem && 'name' in selectedItem ? selectedItem.id : undefined);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                ...(isRole1(roleId) ? [fetchHeadCategory()] : []),
                ...(isRole2(roleId) ? [fetchHeadCategorySelect(), fetchAdminAssign(), fetchAdminUsersRef()] : [fetchSupportTeam(), fetchAdminUsersRef()]),
            ]);
        } else if (isRole2(roleId) && supportToast?.current) {
            supportToast.current.show({ severity: 'error', summary: 'Error', detail: 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ', life: 4000 });
        }
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData | HeadCategoryData | UserRoleData | { id: number; employee?: { first_name?: string; last_name?: string }; username?: string }) => {
        let displayName = 'ລາຍການນີ້';
        if ('userName' in item && (item as UserRoleData).userName) displayName = (item as UserRoleData).userName + ((item as UserRoleData).roleName ? ` (${(item as UserRoleData).roleName})` : '');
        else if ('name' in item && typeof (item as { name?: string }).name === 'string') displayName = (item as { name: string }).name;
        else if ('employee' in item && item.employee) {
            const emp = item.employee as { first_name?: string; last_name?: string };
            const first = emp.first_name ?? '';
            const last = emp.last_name ?? '';
            const full = `${first} ${last}`.trim();
            const username = (item as { username?: string }).username;
            displayName = full || (username ?? '') || `#${(item as { id: number }).id}`;
        } else if ('id' in item) displayName = `#${item.id}`;
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຂໍ້ມູນ "${displayName}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລົບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: async () => {
                if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) {
                    deleteUserRole(item as UserRoleData);
                    return;
                }
                if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) {
                    deleteHeadCategory(item as HeadCategoryData);
                    return;
                }
                if (isRole2(roleId)) {
                    const ok = await deleteAdminAssign(item as { id: number });
                    if (ok) {
                        await Promise.all([fetchHeadCategorySelect(), fetchAdminAssign(), fetchAdminUsersRef()]);
                    } else if (supportToast?.current) {
                        supportToast.current.show({ severity: 'error', summary: 'Error', detail: 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ', life: 4000 });
                    }
                    return;
                }
                deleteSupport(item as SupportTeamData);
            }
        });
    };

    /** ปิด search + ปุ่มເພີ່ມໃນ card เมื่อ role ບໍ່ມີສິດໃນ tab ນີ້: Role 2 ໃນ tab 0, Role 1 ໃນ tab 1. */
    const isCardDisabledForCurrentRole =
        (isRole2(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) || (isRole1(roleId) && activeIndex === SupportTeamTabs.TECHNICAL);
    const showCreateButton =
        (isRole1(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) ||
        (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT);
    const currentFilter: string = globalFilterByTab[activeIndex] ?? '';
    const setCurrentFilter = (value: string) => setGlobalFilterByTab((prev) => ({ ...prev, [activeIndex]: value }));
    const tableFilterValue = currentFilter;

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl">{config.header}</h5>
            <div className="flex gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText
                        value={currentFilter}
                        onChange={(e) => setCurrentFilter(e.target.value)}
                        placeholder="ຄົ້ນຫາ..."
                        className="p-inputtext-sm w-full"
                        disabled={isCardDisabledForCurrentRole}
                    />
                </span>
                {showCreateButton && (
                    <Button label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openNew} />
                )}
            </div>
        </div>
    );

    return (
        <div className="card p-4 surface-card shadow-2 border-round">
            <style>{CUSTOM_TAB_CSS}</style>
            <Toast ref={toast} position="top-center" />
            <ConfirmDialog />
            <TabMenu 
                model={tabMenuModel} 
                activeIndex={safeMenuActiveIndex} 
                onTabChange={(e) => {
                    const tab = tabItems[e.index];
                    if (!tab || (tabMenuModel[e.index] as { disabled?: boolean })?.disabled) return;
                    setActiveIndex(tab.tabIndex);
                }} 
                className="mb-4 custom-tabmenu" 
            />

            {activeIndex === SupportTeamTabs.STAFF ? (
                <StaffTable
                    items={staffTableItems}
                    header={renderHeader()}
                    globalFilter={tableFilterValue}
                    canEditRole={isRole1(roleId) || isRole2(roleId)}
                    onEdit={(item) => openEdit(item)}
                    isLoading={tableLoading}
                />
            ) : activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (
                <RoleManagementTable
                    items={userRoleItems}
                    header={renderHeader()}
                    globalFilter={tableFilterValue}
                    onEdit={(item) => openEdit(item)}
                    onDelete={(item) => confirmDelete(item)}
                    isLoading={tableLoading}
                />
            ) : (
            <SupportTeamTable
                items={activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : supportItems}
                header={renderHeader()}
                globalFilter={tableFilterValue}
                label={config.label}
                activeTab={activeIndex}
                onEdit={(item) => openEdit(item as SupportTeamData | HeadCategoryData)}
                onDelete={(item) => confirmDelete(item as SupportTeamData | HeadCategoryData)}
                issueCategoryMap={issueCategoryMap}
                technicalTabRows={technicalTabRows}
                disableActions={isCardDisabledForCurrentRole || (isRole2(roleId) && (activeIndex === SupportTeamTabs.ISSUE_CATEGORY || activeIndex === SupportTeamTabs.TECHNICAL))}
                headCategoryHasNestedData={isRole1(roleId)}
                divisions={divisions}
                isLoading={tableLoading}
            />
            )}

            {activeIndex === SupportTeamTabs.STAFF ? (
                <StaffRoleEditDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveStaffRole}
                    headerTitle="ແກ້ໄຂສະຖານະພະນັກງານ"
                    isSaving={isSaving}
                    editData={selectedItem && 'roleId' in selectedItem && 'employee' in selectedItem ? (selectedItem as AdminAssignUser) : null}
                    roleOptions={staffRoleOptions}
                />
            ) : activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (
                <RoleAssignDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveRoleAssign}
                    headerTitle={config.dialogHeader}
                    isSaving={isSaving}
                    editData={selectedItem && 'userId' in selectedItem && 'roleId' in selectedItem ? (selectedItem as UserRoleData) : null}
                    userOptions={userOptionsForRoleTab}
                    roleOptions={roleOptionsForRoleTab}
                    userList={adminUsers}
                    allowSearchById={isRole1(roleId)}
                />
            ) : activeIndex === SupportTeamTabs.ISSUE_CATEGORY && isRole1(roleId) ? (
                <HeadCategoryCreateDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveHeadCategory}
                    headerTitle={config.dialogHeader}
                    isSaving={isSaving}
                    editData={selectedItem && 'divisionId' in selectedItem ? selectedItem : null}
                    divisionOptions={divisionOptions}
                    divisions={divisions}
                    defaultDivisionId={!selectedItem ? userDivisionId ?? undefined : undefined}
                    defaultDepartmentId={!selectedItem ? userDepartmentId ?? undefined : undefined}
                    lockDivisionDropdown={false}
                />
            ) : (
                <SupportTeamCreateDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveSupport}
                    headerTitle={config.dialogHeader}
                    inputLabel={config.label}
                    isSaving={isSaving}
                    editData={selectedItem && 'name' in selectedItem ? (selectedItem as SupportTeamData) : null}
                    activeTab={activeIndex}
                    headCategorySelectItems={headCategorySelectItems}
                    headCategoryTeamOptions={headCategoryTeamOptions}
                    adminUsers={adminUsers}
                />
            )}
        </div>
    );
}