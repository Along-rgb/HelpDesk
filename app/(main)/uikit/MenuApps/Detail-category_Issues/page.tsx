// src/uikit/MenuApps/Detail-category_Issues/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import IssuesTable from './IssuesTable';
import IssuesCreateDialog from './IssuesCreateDialog';
import IssuesIconTable from './IssuesIconTable';
import IssuesIconCreateDialog from './IssuesIconCreateDialog';
import { useIssues } from '../hooks/useIssues';
import { useIssueIcons } from '../hooks/useIssueIcons';
import { useSupportTeam } from '../hooks/useSupportTeam';
import { IssueData, CreateIssuePayload, IssueTabs } from '../types';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

export default function IssuesPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Main Data
    const { toast, items, saveData, deleteData } = useIssues(activeIndex);
    const { items: iconItems, saveData: saveIconData, deleteData: deleteIconData } = useIssueIcons(activeIndex);
    const { items: supportTeamItems } = useSupportTeam(1);

    const supportTeamMap = useMemo(() => createDataMap(supportTeamItems, 'id', 'name'), [supportTeamItems]);
    const supportTeamOptions = useMemo(() => supportTeamItems.map(t => ({ label: t.name, value: t.id })), [supportTeamItems]);
    const iconMap = useMemo(() => new Map(iconItems.map(i => [i.id, i.iconUrl])), [iconItems]);
    const iconOptions = useMemo(() => iconItems.map(i => ({ label: 'ຮູບໄອຄອນ', value: i.id, iconUrl: i.iconUrl })), [iconItems]);
    
    // [Microservices Strategy] ดึง Category (Tab 0) เตรียมไว้สำหรับ Join
    const { items: categoryItemsFromHook } = useIssues(0);
    const categoryItems = activeIndex === 0 ? items : categoryItemsFromHook;

    // [Performance] 1. แปลง Array เป็น Map ทันที (O(N)) เพื่อให้ Table ดึงใช้ได้เลย (O(1))
    const categoryMap = useMemo(() => {
        return createDataMap(categoryItems, 'id', 'title');
    }, [categoryItems]);

    // [UX] 2. แปลงเป็น Options สำหรับ Dropdown
    const categoryOptions = useMemo(() => {
        return categoryItems.map(c => ({ label: c.title, value: c.id }));
    }, [categoryItems]);
    
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isIconDialogVisible, setIconDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<IssueData | null>(null);
    const [selectedIconItem, setSelectedIconItem] = useState<import('../types').IconItemData | null>(null);

    const tabItems = [{ label: 'ໝວດໝູ່' }, { label: 'ລາຍການຫົວຂໍ້' }, { label: 'ເພີ່ມໄອຄອນ' }];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    const { tableHeaderTitle, columnNameHeader } = useMemo(() => {
        if (activeIndex === 0)
            return { tableHeaderTitle: 'ຈັດການໝວດໝູ່ການແຈ້ງບັນຫາ', columnNameHeader: 'ຊື່ໝວດໝູ່' };
        if (activeIndex === 1)
            return { tableHeaderTitle: 'ຈັດການລາຍການຫົວຂໍ້', columnNameHeader: 'ຊື່ລາຍການຫົວຂໍ້' };
        return { tableHeaderTitle: 'ເພີ່ມຮູປໄອຄອນ', columnNameHeader: '' };
    }, [activeIndex]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: IssueData) => { setSelectedItem(item); setDialogVisible(true); };
    const openIconNew = () => { setSelectedIconItem(null); setIconDialogVisible(true); };
    const openIconEdit = (item: import('../types').IconItemData) => { setSelectedIconItem(item); setIconDialogVisible(true); };

    const handleSave = async (payload: CreateIssuePayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const handleIconSave = async (payload: import('../types').CreateIconPayload) => {
        setSaving(true);
        const success = await saveIconData(payload, selectedIconItem?.id);
        if (success) setIconDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: IssueData) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລຶບ "${item.title}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລຶບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: () => deleteData(item)
        });
    };

    const confirmIconDelete = (item: import('../types').IconItemData) => {
        confirmDialog({
            message: 'ທ່ານຕ້ອງການລຶບຮູບໄອຄອນນີ້ ແທ້ບໍ່?',
            header: 'ຢືນຢັນການລຶບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: () => deleteIconData(item)
        });
    };

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl text-900">{tableHeaderTitle}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ.." className="p-inputtext-sm w-full md:w-15rem" />
                </span>
                {activeIndex === IssueTabs.ICON ? (
                    <Button tabIndex={0} label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openIconNew} />
                ) : (
                    <Button tabIndex={0} label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openNew} />
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
                <TabMenu model={tabItems} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-tabmenu" />
            </div>

                {activeIndex === IssueTabs.ICON ? (
                <>
                    <IssuesIconTable
                        items={iconItems}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        onEdit={openIconEdit}
                        onDelete={confirmIconDelete}
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
                        items={items}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        nameColumnHeader={columnNameHeader}
                        activeTab={activeIndex}
                        onEdit={openEdit}
                        onDelete={confirmDelete}
                        categoryMap={categoryMap}
                        supportTeamMap={supportTeamMap}
                        iconMap={iconMap}
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
                        supportTeamOptions={supportTeamOptions}
                        iconOptions={iconOptions}
                    />
                </>
            )}
        </div>
    );
}