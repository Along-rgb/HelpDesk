// src/uikit/MenuApps/Detail-category-SupportTeam/page.tsx
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import RoleAssignDialog from './RoleAssignDialog';
import StaffTable from './StaffTable';
import StaffEditDialog from './StaffEditDialog';
import type { StaffEditSavePayload } from './StaffEditDialog';
import { useShallow } from 'zustand/react/shallow';
import { useSupportTeamStore } from '@/app/store/helpdesk';
import { useStoreToast } from '@/app/hooks/useStoreToast';
import { SupportTeamData, CreateSupportTeamPayload, HeadCategoryData, SupportTeamTabs, SupportTeamTechnicalRow, UserRoleData, AdminAssignUser } from '../types';
import type { HeadCategorySavePayload } from './HeadCategoryCreateDialog';
import type { RoleAssignSavePayload } from './RoleAssignDialog';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';
import { useUserProfile } from '@/types/useUserProfile';
import { getRoleDisplayNameLao } from './roleDisplayName';

/** tabIndex 0 = ທິມສະໜັບສະໜູນ, 1 = ວິຊາການ, 2 = ສະຖານະ, 3 = ພະນັກງານ. Tab ສະຖານະ ປິດ (disabled) ໃຫ້ Role 1. */
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
    const toastRef = useRef<Toast>(null);

    // Selector with useShallow: re-render only when selected state actually changes (performance)
    const {
        headCategoryItems,
        headCategorySelectItems,
        supportItems,
        divisions,
        divisionOptions,
        roleOptions,
        adminUsers,
        adminAssignItems,
        userRoleItems,
        loadingHeadCategory,
        loadingHeadCategorySelect,
        loadingSupport,
        loadingAdminUsers,
        loadingAdminAssign,
        loadingUserRoles,
        error,
        successMessage,
        clearMessages,
    } = useSupportTeamStore(
        useShallow((s) => ({
            headCategoryItems: s.headCategoryItems,
            headCategorySelectItems: s.headCategorySelectItems,
            supportItems: s.supportItems,
            divisions: s.divisions,
            divisionOptions: s.divisionOptions,
            roleOptions: s.roleOptions,
            adminUsers: s.adminUsers,
            adminAssignItems: s.adminAssignItems,
            userRoleItems: s.userRoleItems,
            loadingHeadCategory: s.loadingHeadCategory,
            loadingHeadCategorySelect: s.loadingHeadCategorySelect,
            loadingSupport: s.loadingSupport,
            loadingAdminUsers: s.loadingAdminUsers,
            loadingAdminAssign: s.loadingAdminAssign,
            loadingUserRoles: s.loadingUserRoles,
            error: s.error,
            successMessage: s.successMessage,
            clearMessages: s.clearMessages,
        }))
    );

    /** Only run when profile is loaded and user has access (Role 1 or 2) */
    const profileReady = roleId === 1 || roleId === 2;
    const canAccessTechnical = isRole2(roleId);
    const canAccessFullHeadCategory = isRole1(roleId);
    const defaultTabIndex = useMemo(() => (canAccessFullHeadCategory ? SupportTeamTabs.ISSUE_CATEGORY : SupportTeamTabs.TECHNICAL), [canAccessFullHeadCategory]);

    useStoreToast(toastRef, { error, successMessage, clearMessages });

    /** Fetch data by tab/role — use getState() so effects don't subscribe to store */
    useEffect(() => {
        if (!profileReady) return;
        const c = new AbortController();
        if (isRole1(roleId)) useSupportTeamStore.getState().fetchDivisions(c.signal);
        return () => c.abort();
    }, [profileReady, roleId]);

    useEffect(() => {
        if (!profileReady || !(activeIndex === SupportTeamTabs.ROLE_MANAGEMENT || activeIndex === SupportTeamTabs.STAFF)) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchRoles(c.signal);
        return () => c.abort();
    }, [profileReady, activeIndex]);

    useEffect(() => {
        if (!profileReady || !canAccessFullHeadCategory || activeIndex !== SupportTeamTabs.ISSUE_CATEGORY) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchHeadCategory(c.signal);
        return () => c.abort();
    }, [profileReady, canAccessFullHeadCategory, activeIndex]);

    useEffect(() => {
        if (!profileReady || !isRole1(roleId) || activeIndex !== SupportTeamTabs.TECHNICAL) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchSupportTeam('SUPPORT', c.signal);
        return () => c.abort();
    }, [profileReady, roleId, activeIndex]);

    useEffect(() => {
        if (!profileReady || !canAccessTechnical || activeIndex > 1) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchHeadCategorySelect(c.signal);
        return () => c.abort();
    }, [profileReady, canAccessTechnical, activeIndex]);

    useEffect(() => {
        if (!profileReady || !canAccessTechnical || activeIndex !== SupportTeamTabs.TECHNICAL) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchAdminAssign(c.signal);
        return () => c.abort();
    }, [profileReady, canAccessTechnical, activeIndex]);

    useEffect(() => {
        const needUserList = (canAccessTechnical && activeIndex === SupportTeamTabs.TECHNICAL) || activeIndex === SupportTeamTabs.ROLE_MANAGEMENT || activeIndex === SupportTeamTabs.STAFF;
        if (!profileReady || !needUserList) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchUsers(roleId, c.signal);
        return () => c.abort();
    }, [profileReady, roleId, activeIndex, canAccessTechnical]);

    useEffect(() => {
        if (!profileReady || activeIndex !== SupportTeamTabs.ROLE_MANAGEMENT) return;
        const c = new AbortController();
        useSupportTeamStore.getState().fetchUserRoles(roleId, c.signal);
        return () => c.abort();
    }, [profileReady, roleId, activeIndex]);

    const usersItems = adminUsers ?? [];

    /** Role 1: full list from GET /api/headcategorys. Role 2: list from selectheadcategory, filtered by division. */
    const headCategoryItemsForDisplay = useMemo((): HeadCategoryData[] => {
        if (isRole1(roleId)) {
            const list = headCategoryItems ?? [];
            return list.map((h) => ({ ...h, description: h.description ?? '' })) as HeadCategoryData[];
        }
        const list = headCategorySelectItems ?? [];
        const normalized = list.map((h) => ({ ...h, description: h.description ?? '' })) as HeadCategoryData[];
        if (userDivisionId != null) return normalized.filter((h) => h.divisionId === userDivisionId);
        return normalized;
    }, [roleId, headCategoryItems, headCategorySelectItems, userDivisionId]);

    const items = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (userRoleItems ?? []) : (supportItems ?? []);

    /** loading ຂອງ tab ປັດຈຸບັນ — ບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນເປີດໜ້າ/refresh ຫຼື ຍັງໂຫຼດຂໍ້ມູນ */
    const tableLoading = useMemo(() => {
        if (!profileReady) return true;
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return loadingHeadCategory;
        if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) return loadingUserRoles;
        if (activeIndex === SupportTeamTabs.STAFF) return loadingAdminUsers;
        return isRole1(roleId) ? loadingSupport : (loadingHeadCategorySelect || loadingAdminAssign);
    }, [profileReady, activeIndex, roleId, loadingHeadCategory, loadingUserRoles, loadingAdminUsers, loadingSupport, loadingHeadCategorySelect, loadingAdminAssign]);

    /** ໂຫຼດແບບມິນິມอล — ສະແດງແຕ່ຄັ້ງແຮກ (ຍັງບໍ່ມີຂໍ້ມູນໃນ tab ນີ້) */
    const tableLoadingFirstOnly = tableLoading && (items?.length ?? 0) === 0;

    const issueCategoryMap = useMemo(() => createDataMap(headCategoryItemsForDisplay, 'id', 'name'), [headCategoryItemsForDisplay]);

    /** แถวสำหรับ tab ວິຊາການ: Role 1 = section+user ຈາກ headcategorys + users/adminassign. Role 2 = กลุ่มตาม division_name เป็นหัวข้อ (แบบຕຶກ/ລະດັບຊັ້ນ) ບໍ່ມີ icon. */
    const STAFF_ROLE_ID = 3;
    const technicalTabRows = useMemo((): SupportTeamTechnicalRow[] => {
        const userList = (adminAssignItems ?? []).filter((u) => Number(u.roleId) === STAFF_ROLE_ID);
        if (canAccessTechnical) {
            // Role 2: กลุ่มตาม division_name — แถวหัวข้อ division_section (ເປັນແບບ ຕຶກສຳນັກງານໃຫຍ່ ຟຟລ ແຕ່ບໍ່ມີ icon) ຈາກນັ້ນຄືແຖວ user
            const byDivision = new Map<string, typeof userList>();
            for (const u of userList) {
                const divisionName = u.employee?.division?.division_name?.trim() || '-';
                if (!byDivision.has(divisionName)) byDivision.set(divisionName, []);
                byDivision.get(divisionName)!.push(u);
            }
            const sortedDivisionNames = Array.from(byDivision.keys()).sort((a, b) => (a === '-' ? 1 : b === '-' ? -1 : a.localeCompare(b)));
            const rows: SupportTeamTechnicalRow[] = [];
            for (const divName of sortedDivisionNames) {
                rows.push({ type: 'division_section', name: divName });
                for (const u of byDivision.get(divName)!) {
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
        }
        // Role 1: section ຈາກ headcategorys/selectheadcategory + user ຈາກ users/adminassign ຕາມ department/division
        const rows: SupportTeamTechnicalRow[] = [];
        let headList = headCategorySelectItems ?? [];
        if (userDepartmentId != null) {
            const filtered = headList.filter((h) => h.departmentId === userDepartmentId);
            if (filtered.length > 0) headList = filtered;
        }
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
        const list = headCategorySelectItems ?? [];
        const filtered =
            userDepartmentId != null && canAccessTechnical
                ? list.filter((h) => h.departmentId === userDepartmentId)
                : list;
        return filtered.map((h) => ({ label: h.name, value: h.id }));
    }, [headCategorySelectItems, userDepartmentId, canAccessTechnical]);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    /** ช่องค้นหาแยกตาม tab — tabIndex 0,1,2,3 ໃຊ້ຄ່າຄົ້ນຫາຂອງແຕ່ລະແຖບເພື່ອບໍ່ໃຫ້ພິມແລ້ວເຊື່ອມກັນຂ້າມແຖບ */
    const [globalFilterByTab, setGlobalFilterByTab] = useState<Record<number, string>>({});
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | HeadCategoryData | UserRoleData | AdminAssignUser | null>(null);

    /** ຄ່າຄົ້ນຫາຂອງແຖບປັດຈຸບັນ — ໃຊ້ໃນ header ແລະສົ່ງໃຫ້ຕາຕະລາງຂອງແຖບນັ້ນເທົ່ານັ້ນ */
    const globalFilter = globalFilterByTab[activeIndex] ?? '';

    /** Role 1: ວິຊາການ (tab 1) disabled, ສະຖານະ (tab 2) disabled. Role 2: ທິມສະໜັບສະໜູນ (tab 0) disabled, ພະນັກງານ (tab 3) disabled. */
    const tabItems = useMemo(() => [...ALL_TAB_ITEMS], []);

    const tabMenuModel = useMemo(() => tabItems.map((t) => ({
        label: t.label,
        disabled:
            (isRole1(roleId) && t.tabIndex === SupportTeamTabs.TECHNICAL) ||
            (isRole2(roleId) && t.tabIndex === SupportTeamTabs.ISSUE_CATEGORY) ||
            (isRole1(roleId) && t.tabIndex === SupportTeamTabs.ROLE_MANAGEMENT) ||
            (isRole2(roleId) && t.tabIndex === SupportTeamTabs.STAFF),
    })), [tabItems, roleId]);

    const config = useMemo(() => {
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return { header: 'ການຈັດການທີມສະໜັບສະໜູນ', dialogHeader: 'ເພີ່ມທີມສະໜັບສະໜູນ', label: 'ຊື່ທີມສະໜັບສະໜູນ' };
        if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) return { header: 'ການຈັດການສະຖານະ', dialogHeader: 'ເພີ່ມສະຖານະ', label: 'ສະຖານະ' };
        if (activeIndex === SupportTeamTabs.STAFF) return { header: 'ພະນັກງານ', dialogHeader: '', label: '' };
        if (activeIndex === SupportTeamTabs.TECHNICAL && isRole2(roleId)) return { header: 'ວິຊາການ', dialogHeader: 'ເພີ່ມວິຊາການ', label: 'ຊື່ວິຊາການ' };
        return { header: 'ການຈັດການວິຊາການ', dialogHeader: 'ເພີ່ມວິຊາການ', label: 'ຊື່ວິຊາການ' };
    }, [activeIndex, roleId]);

    /** index สำหรับ TabMenu (ลำดับใน tabItems ที่กรองแล้ว) */
    const menuActiveIndex = tabItems.findIndex((t) => t.tabIndex === activeIndex);
    const safeMenuActiveIndex = menuActiveIndex >= 0 ? menuActiveIndex : 0;

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        const requested = tabParam != null && tabParam !== '' ? Number(tabParam) : null;
        if (requested != null && !Number.isNaN(requested) && requested >= 0 && requested < tabItems.length) {
            const blockTab1 = isRole1(roleId) && requested === SupportTeamTabs.TECHNICAL;
            const blockTab0 = isRole2(roleId) && requested === SupportTeamTabs.ISSUE_CATEGORY;
            const blockTab2 = isRole1(roleId) && requested === SupportTeamTabs.ROLE_MANAGEMENT;
            const blockTab3 = isRole2(roleId) && requested === SupportTeamTabs.STAFF;
            if (!blockTab1 && !blockTab0 && !blockTab2 && !blockTab3) setActiveIndex(requested);
            else setActiveIndex(defaultTabIndex);
        } else if (profileReady) {
            setActiveIndex(defaultTabIndex);
        }
        if (isRole1(roleId)) {
            setActiveIndex((prev) => (prev === SupportTeamTabs.TECHNICAL || prev === SupportTeamTabs.ROLE_MANAGEMENT ? SupportTeamTabs.ISSUE_CATEGORY : prev));
        }
        if (isRole2(roleId)) {
            setActiveIndex((prev) => {
                if (prev === SupportTeamTabs.ISSUE_CATEGORY || prev === SupportTeamTabs.STAFF) return SupportTeamTabs.TECHNICAL;
                return prev;
            });
        }
    }, [searchParams, roleId, profileReady, defaultTabIndex, tabItems.length]);
    /** ຕາຕະລາງສະຖານະ: ຕົວເລືອກຜູ້ໃຊ້ຈາກ adminUsers (Role 1 = /api/users, Role 2 = /api/users/admin). Label = [username] first_name last_name ເພື່ອຄົ້ນຫາດ້ວຍລະຫັດພະນັກງານ. */
    const userOptionsForRoleTab = useMemo(() => {
        const list = adminUsers ?? [];
        return list.map((u) => {
            const first = u.employee?.first_name ?? '';
            const last = u.employee?.last_name ?? '';
            const namePart = `${first} ${last}`.trim();
            const label = namePart ? `[${u.username}] ${namePart}` : `[${u.username}]`;
            return { label, value: u.id };
        });
    }, [adminUsers]);
    /** ຕົວເລືອກສະຖານະ: ໃຊ້ໃນການເພີ່ມສະຖານະ — ບໍ່ໃຫ້ເລືອກ role 1 (SuperAdmin) */
    const roleOptionsForRoleTab = useMemo(() => {
        return (roleOptions ?? []).filter((o) => o.value !== 1);
    }, [roleOptions]);
    /** ຕົວເລືອກສະຖານະ ສະແດງຜົນເປັນລາວ (Tab 0–3) */
    const roleOptionsForRoleTabLao = useMemo(() => {
        return roleOptionsForRoleTab.map((o) => ({ ...o, label: getRoleDisplayNameLao(o.value, o.label) }));
    }, [roleOptionsForRoleTab]);
    const roleOptionsLao = useMemo(() => {
        return (roleOptions ?? []).map((o) => ({ ...o, label: getRoleDisplayNameLao(o.value, o.label) }));
    }, [roleOptions]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: SupportTeamData | HeadCategoryData | UserRoleData | AdminAssignUser) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSaveHeadCategory = async (payload: HeadCategorySavePayload) => {
        setSaving(true);
        const id = selectedItem && 'divisionId' in selectedItem ? selectedItem.id : undefined;
        const get = useSupportTeamStore.getState();
        const success = await get.saveHeadCategory(payload, id);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                get.fetchHeadCategorySelect(),
                get.fetchSupportTeam('SUPPORT'),
                get.fetchUsers(roleId),
            ]);
        }
        setSaving(false);
    };
    const handleSaveRoleAssign = async (payload: RoleAssignSavePayload) => {
        setSaving(true);
        const id = selectedItem && 'roleId' in selectedItem && 'userId' in selectedItem ? (selectedItem as UserRoleData).id : undefined;
        const get = useSupportTeamStore.getState();
        const success = await get.saveUserRole(payload, id);
        if (success) {
            setDialogVisible(false);
            await Promise.all([get.fetchUserRoles(roleId), get.fetchRoles(), get.fetchUsers(roleId)]);
        }
        setSaving(false);
    };

    const handleSaveStaffEdit = async (payload: StaffEditSavePayload) => {
        setSaving(true);
        const get = useSupportTeamStore.getState();
        const success = await get.saveUserRole(payload);
        if (success) {
            setDialogVisible(false);
            await get.fetchUsers(roleId);
        }
        setSaving(false);
    };

    const handleSaveSupport = async (payload: CreateSupportTeamPayload) => {
        setSaving(true);
        const id = selectedItem && 'id' in selectedItem ? selectedItem.id : undefined;
        const get = useSupportTeamStore.getState();
        const success = isRole2(roleId)
            ? await get.saveAdminAssign(payload as unknown as Record<string, unknown>, id)
            : await get.saveSupportTeam(payload, selectedItem && 'name' in selectedItem ? selectedItem.id : undefined);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                get.fetchHeadCategorySelect(),
                get.fetchSupportTeam('SUPPORT'),
                get.fetchAdminAssign(),
                get.fetchUsers(roleId),
            ]);
        }
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData | HeadCategoryData | UserRoleData | { id: number; employee?: { first_name?: string; last_name?: string }; username?: string }) => {
        let displayName = 'ລາຍການນີ້';
        if ('userName' in item && (item as UserRoleData).userName) {
            const ur = item as UserRoleData;
            const roleLao = getRoleDisplayNameLao(ur.roleId, ur.roleName);
            displayName = ur.userName + (roleLao && roleLao !== '-' ? ` (${roleLao})` : '');
        }
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
                const get = useSupportTeamStore.getState();
                if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) {
                    await get.deleteUserRole(item as UserRoleData);
                    return;
                }
                if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) {
                    await get.deleteHeadCategory((item as HeadCategoryData).id);
                    return;
                }
                if (isRole2(roleId)) {
                    await get.deleteAdminAssign((item as { id: number }).id);
                    await Promise.all([get.fetchHeadCategorySelect(), get.fetchAdminAssign(), get.fetchUsers(roleId)]);
                    return;
                }
                await get.deleteSupportTeam((item as SupportTeamData).id);
            }
        });
    };

    /** ปิด search + ปุ่มເພີ່ມໃນ card เมื่อ role ບໍ່ມີສິດໃນ tab ນີ້: Role 2 ໃນ tab 0, Role 1 ໃນ tab 1. Tab ພະນັກງານ ອ່ານຢ່າງດຽວ ບໍ່ມີປຸ່ມເພີ່ມ. */
    const isCardDisabledForCurrentRole =
        (isRole2(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) || (isRole1(roleId) && activeIndex === SupportTeamTabs.TECHNICAL);
    const showCreateButton =
        (isRole1(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) ||
        (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT && !isRole1(roleId));
    const renderHeader = () => (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl">{config.header}</h5>
            <div className="flex gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilterByTab((prev) => ({ ...prev, [activeIndex]: e.target.value }))}
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
            <Toast ref={toastRef} position="top-center" />
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

            {activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (
                <RoleManagementTable
                    items={userRoleItems ?? []}
                    header={renderHeader()}
                    globalFilter={globalFilter}
                    onEdit={(item) => openEdit(item)}
                    onDelete={(item) => confirmDelete(item)}
                    isLoading={tableLoadingFirstOnly}
                />
            ) : activeIndex === SupportTeamTabs.STAFF ? (
                <StaffTable
                    items={usersItems ?? []}
                    header={renderHeader()}
                    globalFilter={globalFilter}
                    isLoading={tableLoadingFirstOnly}
                    onEdit={(row) => openEdit(row)}
                />
            ) : (
            <SupportTeamTable
                items={activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : (supportItems ?? [])}
                header={renderHeader()}
                globalFilter={globalFilter}
                label={config.label}
                activeTab={activeIndex}
                onEdit={(item) => openEdit(item as SupportTeamData | HeadCategoryData)}
                onDelete={(item) => confirmDelete(item as SupportTeamData | HeadCategoryData)}
                issueCategoryMap={issueCategoryMap}
                technicalTabRows={technicalTabRows}
                disableActions={isCardDisabledForCurrentRole || (isRole2(roleId) && (activeIndex === SupportTeamTabs.ISSUE_CATEGORY || activeIndex === SupportTeamTabs.TECHNICAL))}
                technicalShowSectionColumn={!(isRole2(roleId) && activeIndex === SupportTeamTabs.TECHNICAL)}
                headCategoryHasNestedData={isRole1(roleId)}
                divisions={divisions ?? []}
                isLoading={tableLoadingFirstOnly}
            />
            )}

            {activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (
                <RoleAssignDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveRoleAssign}
                    headerTitle={config.dialogHeader}
                    isSaving={isSaving}
                    editData={selectedItem && 'userId' in selectedItem && 'roleId' in selectedItem ? (selectedItem as UserRoleData) : null}
                    userOptions={userOptionsForRoleTab}
                    roleOptions={roleOptionsForRoleTabLao}
                    userList={adminUsers ?? []}
                    allowSearchById={isRole1(roleId)}
                />
            ) : activeIndex === SupportTeamTabs.STAFF && selectedItem && 'employee' in selectedItem ? (
                <StaffEditDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveStaffEdit}
                    staffData={selectedItem as AdminAssignUser}
                    roleOptions={roleOptionsLao}
                    isSaving={isSaving}
                />
            ) : activeIndex === SupportTeamTabs.ISSUE_CATEGORY && isRole1(roleId) ? (
                <HeadCategoryCreateDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveHeadCategory}
                    headerTitle={config.dialogHeader}
                    isSaving={isSaving}
                    editData={selectedItem && 'divisionId' in selectedItem ? selectedItem : null}
                    divisionOptions={divisionOptions ?? []}
                    divisions={divisions ?? []}
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
                    headCategorySelectItems={headCategorySelectItems ?? []}
                    headCategoryTeamOptions={headCategoryTeamOptions}
                    adminUsers={adminUsers ?? []}
                />
            )}
        </div>
    );
}