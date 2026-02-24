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
import RoleAssignDialog from './RoleAssignDialog';
import { useSupportTeam } from '../hooks/useSupportTeam';
import { useHeadCategory } from '../hooks/useHeadCategory';
import { useHeadCategorySelect } from '../hooks/useHeadCategorySelect';
import { useAdminAssignUsers } from '../hooks/useAdminAssignUsers';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useDivisions } from '../hooks/useDivisions';
import { useRoles } from '../hooks/useRoles';
import { useUserRoles } from '../hooks/useUserRoles';
import { SupportTeamData, CreateSupportTeamPayload, HeadCategoryData, SupportTeamTabs, SupportTeamTechnicalRow, UserRoleData } from '../types';
import type { HeadCategorySavePayload } from './HeadCategoryCreateDialog';
import type { RoleAssignSavePayload } from './RoleAssignDialog';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';
import { useUserProfile } from '@/types/useUserProfile';

/** tabIndex 0 = ທິມສະໜັບສະໜູນ, 1 = ວິຊາການ, 2 = ສະຖານະ. Tab ສະຖານະ ເຂົ້າໃຊ້ໄດ້ທັງ Role 1 ແລະ 2. */
const ALL_TAB_ITEMS = [
    { label: 'ທິມສະໜັບສະໜູນ', tabIndex: SupportTeamTabs.ISSUE_CATEGORY },
    { label: 'ວິຊາການ', tabIndex: SupportTeamTabs.TECHNICAL },
    { label: 'ສະຖານະ', tabIndex: SupportTeamTabs.ROLE_MANAGEMENT },
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

    const { toast: headCategoryToast, items: headCategoryItems, saveData: saveHeadCategory, deleteData: deleteHeadCategory, fetchData: fetchHeadCategory } = useHeadCategory(0, profileReady && canAccessFullHeadCategory);
    const { options: divisionOptions, divisions } = useDivisions(profileReady && isRole1(roleId));
    /** Role 1 only: GET /support-teams. Role 2 ບໍ່ເອີ້ນ (404 ຫຼື ບໍ່ມີ endpoint ສຳລັບ Role 2). */
    const { toast: supportToast, items: supportItems, saveData: saveSupport, deleteData: deleteSupport, fetchData: fetchSupportTeam } = useSupportTeam(activeIndex, profileReady && isRole1(roleId));
    /** Role 2: use for tab ທິມສະໜັບສະໜູນ list + tab ວິຊາການ. Role 1: not used for tab 0 (uses headCategoryItems). */
    const { items: headCategorySelectItems, fetchData: fetchHeadCategorySelect } = useHeadCategorySelect(activeIndex, profileReady && canAccessTechnical);
    /** Role 2: ໃຊ້ GET/POST/PUT/DELETE users/adminassign ສຳລັບ tab ວິຊາການ. Role 1: disabled ເພື່ອຫຼີກເວັ້ນ 403. */
    const { items: adminAssignItems, fetchData: fetchAdminAssign, saveData: saveAdminAssign, deleteData: deleteAdminAssign } = useAdminAssignUsers(activeIndex, profileReady && canAccessTechnical);
    const { items: adminUsers, fetchData: fetchAdminUsers } = useAdminUsers(activeIndex, profileReady && (canAccessTechnical || activeIndex === SupportTeamTabs.ROLE_MANAGEMENT));
    const { options: roleOptions, fetchData: fetchRoles } = useRoles(profileReady && (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT));
    /** Role 1 only ເພື່ອຫຼີກເວັ້ນ 404 — backend ອາດຈະຍັງບໍ່ມີ /api/user-roles ຫຼື ຈຳກັດສິດ. */
    const { toast: userRolesToast, items: userRoleItems, saveData: saveUserRole, deleteData: deleteUserRole, fetchData: fetchUserRoles } = useUserRoles(profileReady && isRole1(roleId) && activeIndex === SupportTeamTabs.ROLE_MANAGEMENT);

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

    const issueCategoryMap = useMemo(() => createDataMap(headCategoryItemsForDisplay, 'id', 'name'), [headCategoryItemsForDisplay]);

    /** แถวสำหรับ tab ວິຊາການ: ສະແດງແຕ່ section ທີ່ມີຜູ້ໃຊ້ກົງກັບ departmentId/divisionId ເທົ່ານັ້ນ, ແລະແຕ່ລະຄົນໃຊ້ໃນແຕ່ section ດຽວ (ບໍ່ຊ້ຳ). */
    const technicalTabRows = useMemo((): SupportTeamTechnicalRow[] => {
        const rows: SupportTeamTechnicalRow[] = [];
        let headList = Array.isArray(headCategorySelectItems) ? headCategorySelectItems : [];
        if (canAccessTechnical && userDepartmentId != null) {
            headList = headList.filter((h) => h.departmentId === userDepartmentId);
        }
        const userList = Array.isArray(adminAssignItems) ? adminAssignItems : [];
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
            if (usersInSection.length === 0) continue;
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
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | HeadCategoryData | UserRoleData | null>(null);

    /** Role 1: ວິຊາການ (tab 1) disabled. Role 2: ທິມສະໜັບສະໜູນ (tab 0) disabled */
    const tabItems = useMemo(() => [...ALL_TAB_ITEMS], []);

    const tabMenuModel = useMemo(() => tabItems.map((t) => ({
        label: t.label,
        disabled: (isRole1(roleId) && t.tabIndex === SupportTeamTabs.TECHNICAL) || (isRole2(roleId) && t.tabIndex === SupportTeamTabs.ISSUE_CATEGORY),
        // Tab ສະຖານະ (ROLE_MANAGEMENT) ບໍ່ disabled ສຳລັບ role ໃດ
    })), [roleId]);

    const config = useMemo(() => {
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return { header: 'ການຈັດການທີມສະໜັບສະໜູນ', dialogHeader: 'ເພີ່ມທີມສະໜັບສະໜູນ', label: 'ຊື່ທີມສະໜັບສະໜູນ' };
        if (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT) return { header: 'ການຈັດການສະຖານະ', dialogHeader: 'ເພີ່ມສະຖານະ', label: 'ສະຖານະ' };
        return { header: 'ການຈັດການວິຊາການ', dialogHeader: 'ເພີ່ມວິຊາການ', label: 'ຊື່ວິຊາການ' };
    }, [activeIndex]);

    /** index สำหรับ TabMenu (ลำดับใน tabItems ที่กรองแล้ว) */
    const menuActiveIndex = tabItems.findIndex((t) => t.tabIndex === activeIndex);
    const safeMenuActiveIndex = menuActiveIndex >= 0 ? menuActiveIndex : 0;

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam != null) {
            const index = Number(tabParam);
            if (!isNaN(index) && index >= 0) {
                const blockTab1 = isRole1(roleId) && index === SupportTeamTabs.TECHNICAL;
                const blockTab0 = isRole2(roleId) && index === SupportTeamTabs.ISSUE_CATEGORY;
                if (!blockTab1 && !blockTab0) setActiveIndex(index);
            }
        }
        if (isRole1(roleId)) {
            setActiveIndex((prev) => (prev === SupportTeamTabs.TECHNICAL ? SupportTeamTabs.ISSUE_CATEGORY : prev));
        }
        if (isRole2(roleId)) {
            setActiveIndex((prev) => (prev === SupportTeamTabs.ISSUE_CATEGORY ? SupportTeamTabs.TECHNICAL : prev));
        }
    }, [searchParams, roleId]);
    /** ຕາຕະລາງສະຖານະ: ຕົວເລືອກຜູ້ໃຊ້ຈາກ adminUsers */
    const userOptionsForRoleTab = useMemo(() => {
        const list = Array.isArray(adminUsers) ? adminUsers : [];
        return list.map((u) => {
            const first = u.employee?.first_name ?? '';
            const last = u.employee?.last_name ?? '';
            const label = `${first} ${last}`.trim() || u.username || String(u.id);
            return { label, value: u.id };
        });
    }, [adminUsers]);
    /** ຕົວເລືອກສະຖານະ: ໃຊ້ໃນການເພີ່ມສະຖານະ — ບໍ່ໃຫ້ເລືອກ role 1 (SuperAdmin) */
    const roleOptionsForRoleTab = useMemo(() => {
        return roleOptions.filter((o) => o.value !== 1);
    }, [roleOptions]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: SupportTeamData | HeadCategoryData | UserRoleData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSaveHeadCategory = async (payload: HeadCategorySavePayload) => {
        setSaving(true);
        const id = selectedItem && 'divisionId' in selectedItem ? selectedItem.id : undefined;
        const success = await saveHeadCategory(payload, id);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                ...(isRole1(roleId) ? [fetchHeadCategory()] : []),
                ...(isRole2(roleId) ? [fetchHeadCategorySelect()] : []),
                fetchSupportTeam(),
                fetchAdminUsers(),
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
            await Promise.all([fetchUserRoles(), fetchRoles()]);
        }
        setSaving(false);
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
                ...(isRole2(roleId) ? [fetchHeadCategorySelect(), fetchAdminAssign(), fetchAdminUsers()] : [fetchSupportTeam(), fetchAdminUsers()]),
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
                        await Promise.all([fetchHeadCategorySelect(), fetchAdminAssign(), fetchAdminUsers()]);
                    } else if (supportToast?.current) {
                        supportToast.current.show({ severity: 'error', summary: 'Error', detail: 'ລຶບຂໍ້ມູນບໍ່ສຳເລັດ', life: 4000 });
                    }
                    return;
                }
                deleteSupport(item as SupportTeamData);
            }
        });
    };

    /** Tab ວິຊາການ (tab 1): Role 2 = READ-ONLY (no Create). Create ເພີ່ມໃໝ່: Role 1 ໃນ tab ທິມສະໜັບສະໜູນ; tab ສະຖານະ ໃຫ້ທັງ Role 1 ແລະ 2. */
    const isTab1DisabledForCurrentRole = isRole1(roleId) && activeIndex === SupportTeamTabs.TECHNICAL;
    const showCreateButton =
        (isRole1(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) ||
        (activeIndex === SupportTeamTabs.ROLE_MANAGEMENT);
    const renderHeader = () => (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl">{config.header}</h5>
            <div className="flex gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ..." className="p-inputtext-sm w-full" disabled={isTab1DisabledForCurrentRole} />
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

            {activeIndex === SupportTeamTabs.ROLE_MANAGEMENT ? (
                <RoleManagementTable
                    items={userRoleItems}
                    header={renderHeader()}
                    globalFilter={globalFilter}
                    onEdit={(item) => openEdit(item)}
                    onDelete={(item) => confirmDelete(item)}
                />
            ) : (
            <SupportTeamTable 
                items={activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : supportItems} 
                header={renderHeader()} 
                globalFilter={globalFilter} 
                label={config.label}
                activeTab={activeIndex} 
                onEdit={(item) => openEdit(item as SupportTeamData | HeadCategoryData)}
                onDelete={(item) => confirmDelete(item as SupportTeamData | HeadCategoryData)}
                issueCategoryMap={issueCategoryMap}
                technicalTabRows={technicalTabRows}
                disableActions={isTab1DisabledForCurrentRole || (isRole2(roleId) && activeIndex === SupportTeamTabs.ISSUE_CATEGORY) || (isRole2(roleId) && activeIndex === SupportTeamTabs.TECHNICAL)}
                headCategoryHasNestedData={isRole1(roleId)}
                divisions={divisions}
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
                    roleOptions={roleOptionsForRoleTab}
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