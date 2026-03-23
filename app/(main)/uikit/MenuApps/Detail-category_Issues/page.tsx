// src/uikit/MenuApps/Detail-category_Issues/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { showConfirmDelete } from '@/utils/confirmDeleteDialog';
import IssuesTable from './IssuesTable';
import IssuesCreateDialog from './IssuesCreateDialog';
import IssuesIconTable from './IssuesIconTable';
import IssuesIconCreateDialog from './IssuesIconCreateDialog';
import { useCategories } from '../hooks/useCategories';
import { useIssues } from '../hooks/useIssues';
import { useCategoryIconsSelect } from '../hooks/useCategoryIconsSelect';
import { useCategoryIcons } from '../hooks/useCategoryIcons';
import { useUserProfile } from '@/types/useUserProfile';
import {
    IssueData,
    CreateIssuePayload,
    IssueTabs,
    CategoryData,
    CreateCategoryPayload,
    IconItemData,
    CreateIconPayload,
} from '../types';
import { createDataMap } from '../utils/dataMapping';
import { getCategoryIconDisplayUrl } from '../utils/iconUrl';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

/** Role 2: สิทธิ์จัดการ Tab ໝວດໝູ່ & ລາຍການຫົວຂໍ້. Role 1: สิทธิ์จัดการ Tab ເພີ່ມໄອຄອນ (POST /api/categoryicons ได้ role เดียว). */
const isRole2 = (r: number | string | null | undefined) => Number(r) === 2;
const isRole1 = (r: number | string | null | undefined) => Number(r) === 1;

export default function IssuesPage() {
    const searchParams = useSearchParams();
    const { roleId } = useUserProfile();
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const profileReady = roleId === 1 || roleId === 2;
    const canManageCategoryAndTopic = isRole2(roleId);
    const canManageIcons = isRole1(roleId);

    const { toast: categoryToast, items: categoryItems, loading: categoryLoading, saveData: saveCategory, deleteData: deleteCategory } = useCategories(
        activeIndex,
        profileReady && canManageCategoryAndTopic && activeIndex <= 1
    );
    const { toast: issueToast, items: topicItems, loading: issueLoading, saveData: saveIssue, deleteData: deleteIssue } = useIssues(
        activeIndex,
        profileReady && canManageCategoryAndTopic && activeIndex <= 1
    );
    const { items: categoryIconSelectItems } = useCategoryIconsSelect(
        activeIndex,
        profileReady && (canManageCategoryAndTopic && activeIndex <= 1 || canManageIcons && activeIndex === IssueTabs.ICON)
    );
    const { toast: iconToast, items: iconItems, loading: iconLoading, saveData: saveIconData, deleteData: deleteIconData } = useCategoryIcons(
        activeIndex,
        profileReady && canManageIcons && activeIndex === IssueTabs.ICON
    );

    const categoryIconMap = useMemo(() => {
        const m = new Map<number, string>();
        categoryIconSelectItems.forEach((i) => m.set(i.id, getCategoryIconDisplayUrl(i.catIcon ?? '')));
        return m;
    }, [categoryIconSelectItems]);
    const iconOptions = useMemo(
        () =>
            categoryIconSelectItems.map((i) => ({
                label: 'ຮູບໄອຄອນ',
                value: i.id,
                iconUrl: getCategoryIconDisplayUrl(i.catIcon ?? ''),
            })),
        [categoryIconSelectItems]
    );

    const categoryMap = useMemo(() => createDataMap(categoryItems, 'id', 'title'), [categoryItems]);
    const categoryOptions = useMemo(() => categoryItems.map((c) => ({ label: c.title, value: c.id })), [categoryItems]);

    /** Tab 0: ໝວດໝູ່ທີ່ມີລາຍການຫົວຂໍ້ອີງ — ບໍ່ໃຫ້ລຶບ */
    const categoryIdsInUse = useMemo(
        () => new Set(topicItems.map((t) => t.parentId).filter((id): id is number => id != null)),
        [topicItems]
    );

    const items = activeIndex === IssueTabs.ICON ? iconItems : activeIndex === 0 ? categoryItems : topicItems;
    const toast = activeIndex === 0 ? categoryToast : activeIndex === 1 ? issueToast : iconToast;

    /** loading ຂອງ tab ປັດຈຸບັນ — ບໍ່ໃຫ້ແສງ "ບໍ່ພົບຂໍ້ມູນ" ຕອນເປີດໜ້າ/refresh ຫຼື ຍັງໂຫຼດຂໍ້ມູນ */
    const tableLoading = useMemo(() => {
        if (!profileReady) return true; // ຍັງບໍ່ຮູ້ role — ບໍ່ໃຫ້ແສງ empty
        if (activeIndex === IssueTabs.ICON) return iconLoading;
        if (activeIndex === 0) return categoryLoading;
        return issueLoading;
    }, [profileReady, activeIndex, iconLoading, categoryLoading, issueLoading]);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isIconDialogVisible, setIconDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<IssueData | CategoryData | null>(null);
    const [selectedIconItem, setSelectedIconItem] = useState<IconItemData | null>(null);

    const ALL_ISSUE_TAB_ITEMS = useMemo(() => [
        { label: 'ໝວດໝູ່', tabIndex: IssueTabs.CATEGORY },
        { label: 'ລາຍການຫົວຂໍ້', tabIndex: IssueTabs.TOPIC },
        { label: 'ເພີ່ມໄອຄອນ', tabIndex: IssueTabs.ICON },
    ], []);

    const tabItems = useMemo(() => {
        if (canManageIcons && !canManageCategoryAndTopic) {
            return ALL_ISSUE_TAB_ITEMS.filter(t => t.tabIndex === IssueTabs.ICON);
        }
        if (canManageCategoryAndTopic && !canManageIcons) {
            return ALL_ISSUE_TAB_ITEMS.filter(t => t.tabIndex !== IssueTabs.ICON);
        }
        return [...ALL_ISSUE_TAB_ITEMS];
    }, [canManageCategoryAndTopic, canManageIcons, ALL_ISSUE_TAB_ITEMS]);

    const tabMenuModel = useMemo(() => tabItems.map((t) => ({ label: t.label })), [tabItems]);
    const menuActiveIndex = tabItems.findIndex((t) => t.tabIndex === activeIndex);
    const safeMenuActiveIndex = menuActiveIndex >= 0 ? menuActiveIndex : 0;

    const defaultTabIndex = useMemo(() => {
        if (canManageCategoryAndTopic) return 0;
        if (canManageIcons) return IssueTabs.ICON;
        return 0;
    }, [canManageCategoryAndTopic, canManageIcons]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        const requested =
            tabParam !== null && tabParam !== '' ? Number(tabParam) : null;

        if (
            requested !== null &&
            !Number.isNaN(requested) &&
            requested >= 0 &&
            requested < tabItems.length
        ) {
            if (requested === 0 || requested === 1) {
                if (canManageCategoryAndTopic) {
                    setActiveIndex(requested);
                } else {
                    setActiveIndex(defaultTabIndex);
                }
            } else {
                if (canManageIcons) {
                    setActiveIndex(IssueTabs.ICON);
                } else {
                    setActiveIndex(defaultTabIndex);
                }
            }
        } else {
            setActiveIndex(defaultTabIndex);
        }
    }, [searchParams, canManageCategoryAndTopic, canManageIcons, defaultTabIndex, tabItems.length]);

    const { tableHeaderTitle, columnNameHeader } = useMemo(() => {
        if (activeIndex === 0)
            return { tableHeaderTitle: 'ຈັດການໝວດໝູ່ການແຈ້ງບັນຫາ', columnNameHeader: 'ຊື່ໝວດໝູ່' };
        if (activeIndex === 1)
            return { tableHeaderTitle: 'ຈັດການລາຍການຫົວຂໍ້', columnNameHeader: 'ຊື່ລາຍການຫົວຂໍ້' };
        return { tableHeaderTitle: 'ເພີ່ມຮູປໄອຄອນ', columnNameHeader: '' };
    }, [activeIndex]);

    const openNew = () => {
        setSelectedItem(null);
        setDialogVisible(true);
    };
    const openEdit = (item: IssueData | CategoryData) => {
        setSelectedItem(item);
        setDialogVisible(true);
    };
    const openIconNew = () => {
        setSelectedIconItem(null);
        setIconDialogVisible(true);
    };
    const openIconEdit = (item: IconItemData) => {
        setSelectedIconItem(item);
        setIconDialogVisible(true);
    };

    const handleSave = async (payload: CreateIssuePayload | CreateCategoryPayload) => {
        setSaving(true);
        if (activeIndex === 0) {
            const p = payload as CreateCategoryPayload;
            const id = selectedItem && 'headCategoryId' in selectedItem ? selectedItem.id : undefined;
            const success = await saveCategory(p, id);
            if (success) setDialogVisible(false);
        } else {
            const p = payload as CreateIssuePayload;
            const id = selectedItem && 'parentId' in selectedItem ? selectedItem.id : undefined;
            const success = await saveIssue(p, id);
            if (success) setDialogVisible(false);
        }
        setSaving(false);
    };

    const handleIconSave = async (payload: CreateIconPayload) => {
        setSaving(true);
        const success = await saveIconData(payload, selectedIconItem?.id);
        if (success) setIconDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: IssueData | CategoryData) => {
        const name = 'title' in item ? item.title : '';
        showConfirmDelete({
            displayName: name,
            message: `ທ່ານຕ້ອງການລຶບ "${name}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລຶບ',
            onAccept: () => {
                if (activeIndex === 0) deleteCategory(item as CategoryData);
                else deleteIssue(item as IssueData);
            },
        });
    };

    const confirmIconDelete = (item: IconItemData) => {
        showConfirmDelete({
            displayName: 'ຮູບໄອຄອນນີ້',
            message: 'ທ່ານຕ້ອງການລຶບຮູບໄອຄອນນີ້ ແທ້ບໍ່?',
            header: 'ຢືນຢັນການລຶບ',
            onAccept: () => deleteIconData(item),
        });
    };

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl text-900">{tableHeaderTitle}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="ຄົ້ນຫາ.."
                        className="p-inputtext-sm w-full md:w-15rem"
                        disabled={activeIndex === IssueTabs.ICON && !canManageIcons}
                    />
                </span>
                {activeIndex === IssueTabs.ICON ? (
                    <Button
                        tabIndex={0}
                        label="ເພີ່ມໃໝ່"
                        icon="pi pi-plus"
                        size="small"
                        className="bg-indigo-600 border-indigo-600"
                        onClick={openIconNew}
                        disabled={!canManageIcons}
                    />
                ) : (
                    <Button
                        tabIndex={0}
                        label="ເພີ່ມໃໝ່"
                        icon="pi pi-plus"
                        size="small"
                        className="bg-indigo-600 border-indigo-600"
                        onClick={openNew}
                        disabled={!canManageCategoryAndTopic}
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="card p-4 surface-card shadow-2 border-round">
            <style>{CUSTOM_TAB_CSS}</style>
            <Toast ref={toast} position="top-center" />
            <ConfirmDialog />
            <div className="mb-4">
                <TabMenu
                    model={tabMenuModel}
                    activeIndex={safeMenuActiveIndex}
                    onTabChange={(e) => {
                        const tab = tabItems[e.index];
                        if (!tab) return;
                        setActiveIndex(tab.tabIndex);
                    }}
                    className="custom-tabmenu"
                />
            </div>

            {activeIndex === IssueTabs.ICON ? (
                <>
                    <IssuesIconTable
                        items={iconItems}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        onEdit={openIconEdit}
                        onDelete={confirmIconDelete}
                        canManage={canManageIcons}
                        isLoading={tableLoading}
                    />
                    <IssuesIconCreateDialog
                        visible={isIconDialogVisible}
                        onHide={() => setIconDialogVisible(false)}
                        onSave={handleIconSave}
                        isSaving={isSaving}
                        editData={selectedIconItem}
                        nextSortOrder={iconItems.length + 1}
                    />
                </>
            ) : (
                <>
                    <IssuesTable
                        items={activeIndex === 0 ? categoryItems : topicItems}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        nameColumnHeader={columnNameHeader}
                        activeTab={activeIndex}
                        onEdit={openEdit}
                        onDelete={confirmDelete}
                        categoryMap={categoryMap}
                        categoryIconMap={categoryIconMap}
                        canManage={canManageCategoryAndTopic}
                        isLoading={tableLoading}
                        categoryIdsInUse={activeIndex === 0 ? categoryIdsInUse : undefined}
                    />
                    <IssuesCreateDialog
                        visible={isDialogVisible}
                        onHide={() => setDialogVisible(false)}
                        onSave={handleSave}
                        itemNameLabel={columnNameHeader}
                        isSaving={isSaving}
                        editData={selectedItem}
                        activeTab={activeIndex}
                        categoryOptions={categoryOptions}
                        iconOptions={iconOptions}
                    />
                </>
            )}
        </div>
    );
}
