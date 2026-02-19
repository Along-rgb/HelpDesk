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
import IssuesCreateDialog from '../Detail-category_Issues/IssuesCreateDialog';
import { useSupportTeam } from '../hooks/useSupportTeam';
import { useIssues } from '../hooks/useIssues';
import { SupportTeamData, CreateSupportTeamPayload, IssueData, CreateIssuePayload, SupportTeamTabs } from '../types';
// นำเข้า Utility ที่เราสร้างไว้ (ถ้ายังไม่มีให้สร้างตามคำแนะนำก่อนหน้า)
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

export default function SupportTeamPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState(0);

    const { toast: issuesToast, items: issueItems, saveData: saveIssue, deleteData: deleteIssue } = useIssues(0);
    const { toast: supportToast, items: supportItems, saveData: saveSupport, deleteData: deleteSupport } = useSupportTeam(activeIndex);

    const toast = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? issuesToast : supportToast;
    const items = activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? issueItems : supportItems;

    // [Performance Optimization] สร้าง Map เตรียมไว้ให้ Table (Lookup O(1))
    const issueCategoryMap = useMemo(() => {
        return createDataMap(issueItems, 'id', 'title');
    }, [issueItems]);

    const issueCategoryOptions = useMemo(() => issueItems.map(issue => ({ label: issue.title, value: issue.id })), [issueItems]);
    const adminUserOptions: { label: string; value: any }[] = [];

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | IssueData | null>(null);

    const tabItems = [
        { label: 'ໝວດບັນຫາ' },
        { label: 'ວິຊາການ' },
        { label: 'ທີມຄຸ້ມຄອງ' }
    ];

    const config = useMemo(() => {
        if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) return { header: 'ການຈັດການໝວດບັນຫາ', dialogHeader: 'ເພີ່ມໝວດບັນຫາ', label: 'ຊື່ໝວດບັນຫາ' };
        if (activeIndex === SupportTeamTabs.TECHNICAL) return { header: 'ການຈັດການວິຊາການ', dialogHeader: 'ເພີ່ມວິຊາການ', label: 'ຊື່ວິຊາການ' };
        return { header: 'ການຈັດການທີມຄຸ້ມຄອງ', dialogHeader: 'ເພີ່ມທີມຄຸ້ມຄອງ', label: 'ຊື່ທີມຄຸ້ມຄອງ' };
    }, [activeIndex]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (!isNaN(index) && index >= 0 && index < tabItems.length) {
                setActiveIndex(index);
            }
        }
    }, [searchParams]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: SupportTeamData | IssueData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSaveIssue = async (payload: CreateIssuePayload) => {
        setSaving(true);
        const success = await saveIssue(payload, selectedItem && 'title' in selectedItem ? selectedItem.id : undefined);
        if (success) setDialogVisible(false);
        setSaving(false);
    };
    const handleSaveSupport = async (payload: CreateSupportTeamPayload) => {
        setSaving(true);
        const success = await saveSupport(payload, selectedItem && 'name' in selectedItem ? selectedItem.id : undefined);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData | IssueData) => {
        const name = 'title' in item ? item.title : item.name;
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຂໍ້ມູນ "${name || 'ລາຍການນີ້'}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລົບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: () => {
                if (activeIndex === SupportTeamTabs.ISSUE_CATEGORY) deleteIssue(item as IssueData);
                else deleteSupport(item as SupportTeamData);
            }
        });
    };

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl">{config.header}</h5>
            <div className="flex gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ..." className="p-inputtext-sm w-full" />
                </span>
                <Button label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openNew} />
            </div>
        </div>
    );

    return (
        <div className="card p-4 surface-card shadow-2 border-round">
            <style>{CUSTOM_TAB_CSS}</style>
            <Toast ref={toast} position="top-center" />
            <ConfirmDialog />
            <TabMenu 
                model={tabItems} 
                activeIndex={activeIndex} 
                onTabChange={(e) => setActiveIndex(e.index)} 
                className="mb-4 custom-tabmenu" 
            />

            <SupportTeamTable 
                items={items} 
                header={renderHeader()} 
                globalFilter={globalFilter} 
                label={config.label}
                activeTab={activeIndex} 
                onEdit={openEdit}
                onDelete={confirmDelete}
                // ส่ง Map ไปให้ Table ทำ Lookup
                issueCategoryMap={issueCategoryMap} 
            />

            {activeIndex === SupportTeamTabs.ISSUE_CATEGORY ? (
                <IssuesCreateDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveIssue}
                    itemNameLabel={config.label}
                    isSaving={isSaving}
                    editData={selectedItem && 'title' in selectedItem ? selectedItem : null}
                    activeTab={0}
                    categoryOptions={issueCategoryOptions}
                />
            ) : (
                <SupportTeamCreateDialog
                    visible={isDialogVisible}
                    onHide={() => setDialogVisible(false)}
                    onSave={handleSaveSupport}
                    headerTitle={config.dialogHeader}
                    inputLabel={config.label}
                    isSaving={isSaving}
                    editData={selectedItem && 'name' in selectedItem ? selectedItem : null}
                    activeTab={activeIndex}
                    issueOptions={issueCategoryOptions}
                    userOptions={adminUserOptions}
                />
            )}
        </div>
    );
}