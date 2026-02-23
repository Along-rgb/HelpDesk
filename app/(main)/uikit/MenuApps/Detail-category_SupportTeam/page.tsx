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
import { useSupportTeam } from '../hooks/useSupportTeam';
import { useHeadCategory } from '../hooks/useHeadCategory';
import { useHeadCategorySelect } from '../hooks/useHeadCategorySelect';
import { useAdminAssignUsers } from '../hooks/useAdminAssignUsers';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useDivisions } from '../hooks/useDivisions';
import { SupportTeamData, CreateSupportTeamPayload, HeadCategoryData, SupportTeamTabs, SupportTeamTechnicalRow } from '../types';
import type { HeadCategorySavePayload } from './HeadCategoryCreateDialog';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';
import { useUserProfile } from '@/types/useUserProfile';

/** tabIndex 0 = ທິມສະໜັບສະໜູນ, 1 = ວິຊາການ. ทุก role เห็น tab ทั้งหมด */
const ALL_TAB_ITEMS = [
    { label: 'ທິມສະໜັບສະໜູນ', tabIndex: SupportTeamTabs.ISSUE_CATEGORY },
    { label: 'ວິຊາການ', tabIndex: SupportTeamTabs.TECHNICAL },
] as const;

/** Role 1: ທິມສະໜັບສະໜູນ only. Role 2: ວິຊາການ only. Both use headcategorys/selectheadcategory for team list. */
const isRole2 = (r: number | string | null | undefined) => Number(r) === 2;
const isRole1 = (r: number | string | null | undefined) => Number(r) === 1;

export default function SupportTeamPage() {
    const searchParams = useSearchParams();
    const { roleId, divisionId: userDivisionId, departmentId: userDepartmentId } = useUserProfile();
    const [activeIndex, setActiveIndex] = useState(0);

    /** Only run API hooks when profile is loaded and user has access (Role 1 or 2) to avoid Forbidden on initial load */
    const profileReady = roleId === 1 || roleId === 2;
    const canAccessTechnical = isRole2(roleId);
    /** Role 1 & 2: both use headcategorys/selectheadcategory (shared endpoint, filtered by division on backend) */
    const canAccessHeadCategory = isRole1(roleId) || isRole2(roleId);

    const { toast: headCategoryToast, items: headCategoryItems, saveData: saveHeadCategory, deleteData: deleteHeadCategory, fetchData: fetchHeadCategory } = useHeadCategory(0, profileReady && canAccessHeadCategory);
    const { options: divisionOptions, divisions } = useDivisions();
    const { toast: supportToast, items: supportItems, saveData: saveSupport, deleteData: deleteSupport, fetchData: fetchSupportTeam } = useSupportTeam(activeIndex, profileReady && canAccessTechnical);
    const { items: headCategorySelectItems, fetchData: fetchHeadCategorySelect } = useHeadCategorySelect(activeIndex, profileReady && canAccessTechnical);
    /** ບໍ່ເອີ້ນ API (enabled: false) ເພື່ອຫຼີກເວັ້ນ 403 — Tab ວິຊາການ ໃຊ້ users/admin + departmentId ເທົ່ານັ້ນ */
    useAdminAssignUsers(activeIndex, false);
    const { items: adminUsers, fetchData: fetchAdminUsers } = useAdminUsers(activeIndex, profileReady && canAccessTechnical);

    /** Both roles: use headCategoryItems from selectheadcategory; Role 2 client-side filter by division if needed */
    const headCategoryItemsForDisplay = useMemo((): HeadCategoryData[] => {
        const list = Array.isArray(headCategoryItems) ? headCategoryItems : [];
        const normalized = list.map((h) => ({ ...h, description: h.description ?? '' })) as HeadCategoryData[];
        if (isRole2(roleId) && userDivisionId != null) {
            return normalized.filter((h) => h.divisionId === userDivisionId);
        }
        return normalized;
    }, [roleId, headCategoryItems, userDivisionId]);

    const toast = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryToast : supportToast;
    const items = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? headCategoryItemsForDisplay : supportItems;

    const issueCategoryMap = useMemo(() => createDataMap(headCategoryItemsForDisplay, 'id', 'name'), [headCategoryItemsForDisplay]);

    /** แถวสำหรับ tab ວິຊາການ: ข้อมูลจาก headcategorys/selectheadcategory + users/admin ໃຊ້ departmentId เปรียบเทียบ. Role 2 เห็นเฉพาะ head ที่ departmentId ตรงกับตนเอง */
    const technicalTabRows = useMemo((): SupportTeamTechnicalRow[] => {
        const rows: SupportTeamTechnicalRow[] = [];
        let headList = Array.isArray(headCategorySelectItems) ? headCategorySelectItems : [];
        if (canAccessTechnical && userDepartmentId != null) {
            headList = headList.filter((h) => h.departmentId === userDepartmentId);
        }
        const userList = Array.isArray(adminUsers) ? adminUsers : [];
        for (const head of headList) {
            rows.push({ type: 'section', headCategoryId: head.id, name: head.name, divisionId: head.divisionId, departmentId: head.departmentId });
            const deptId = head.departmentId ?? head.divisionId;
            const usersInDept = userList.filter((u) => (u.employee?.departmentId ?? u.employee?.department?.id) === deptId);
            for (const u of usersInDept) {
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
    }, [headCategorySelectItems, adminUsers, canAccessTechnical, userDepartmentId]);

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
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | HeadCategoryData | null>(null);

    /** Role 1: ວິຊາການ (tab 1) disabled. Role 2: ທິມສະໜັບສະໜູນ (tab 0) disabled */
    const tabItems = useMemo(() => [...ALL_TAB_ITEMS], []);

    const tabMenuModel = useMemo(() => tabItems.map((t) => ({
        label: t.label,
        disabled: (isRole1(roleId) && t.tabIndex === SupportTeamTabs.TECHNICAL) || (isRole2(roleId) && t.tabIndex === SupportTeamTabs.ISSUE_CATEGORY),
    })), [roleId]);

    const config = useMemo(() => {
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return { header: 'ການຈັດການທີມສະໜັບສະໜູນ', dialogHeader: 'ເພີ່ມທີມສະໜັບສະໜູນ', label: 'ຊື່ທີມສະໜັບສະໜູນ' };
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

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: SupportTeamData | HeadCategoryData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSaveHeadCategory = async (payload: HeadCategorySavePayload) => {
        setSaving(true);
        const id = selectedItem && 'divisionId' in selectedItem ? selectedItem.id : undefined;
        const success = await saveHeadCategory(payload, id);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                fetchHeadCategory(),
                fetchHeadCategorySelect(),
                fetchSupportTeam(),
                fetchAdminUsers(),
            ]);
        }
        setSaving(false);
    };
    const handleSaveSupport = async (payload: CreateSupportTeamPayload) => {
        setSaving(true);
        const success = await saveSupport(payload, selectedItem && 'name' in selectedItem ? selectedItem.id : undefined);
        if (success) {
            setDialogVisible(false);
            await Promise.all([
                fetchHeadCategory(),
                fetchHeadCategorySelect(),
                fetchSupportTeam(),
                fetchAdminUsers(),
            ]);
        }
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData | HeadCategoryData) => {
        const name = 'name' in item ? item.name : '';
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຂໍ້ມູນ "${name || 'ລາຍການນີ້'}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລົບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: () => {
                if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) deleteHeadCategory(item as HeadCategoryData);
                else deleteSupport(item as SupportTeamData);
            }
        });
    };

    /** Tab ວິຊາການ (tab 1): ปิดปุ่ม/ค้นหาเฉพาะ Role 1 */
    const isTab1DisabledForCurrentRole = isRole1(roleId) && activeIndex === SupportTeamTabs.TECHNICAL;
    const renderHeader = () => (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl">{config.header}</h5>
            <div className="flex gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ..." className="p-inputtext-sm w-full" disabled={isTab1DisabledForCurrentRole} />
                </span>
                <Button label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openNew} disabled={isTab1DisabledForCurrentRole} />
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

            <SupportTeamTable 
                items={items} 
                header={renderHeader()} 
                globalFilter={globalFilter} 
                label={config.label}
                activeTab={activeIndex} 
                onEdit={(item) => openEdit(item as SupportTeamData | HeadCategoryData)}
                onDelete={(item) => confirmDelete(item as SupportTeamData | HeadCategoryData)}
                issueCategoryMap={issueCategoryMap}
                technicalTabRows={technicalTabRows}
                disableActions={isTab1DisabledForCurrentRole}
            />

            {activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? (
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