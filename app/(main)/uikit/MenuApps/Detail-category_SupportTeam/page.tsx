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
import { useSupportTeam } from '../hooks/useSupportTeam';
import { useIssues } from '../hooks/useIssues';
import { SupportTeamData, CreateSupportTeamPayload } from '../types';
// นำเข้า Utility ที่เราสร้างไว้ (ถ้ายังไม่มีให้สร้างตามคำแนะนำก่อนหน้า)
import { createDataMap } from '../utils/dataMapping'; 

const CUSTOM_TAB_CSS = `
    .custom-tabmenu .p-menuitem-text { color: #6c757d !important; transition: color 0.2s; font-weight: 500; }
    .custom-tabmenu .p-menuitem-link:hover .p-menuitem-text { color: var(--primary-color) !important; }
    .custom-tabmenu .p-highlight .p-menuitem-text { color: var(--primary-color) !important; font-weight: bold; }
    .custom-tabmenu .p-tabmenu-nav { border-bottom: 1px solid #dee2e6; }
    .custom-tabmenu .p-tabmenuitem .p-menuitem-link { background: transparent !important; border: none !important; box-shadow: none !important; }
    .custom-tabmenu .p-highlight .p-menuitem-link { border-bottom: 2px solid var(--primary-color) !important; border-radius: 0; }
`;

export default function SupportTeamPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState(0);

    // 1. Main Data (ทีมงาน)
    const { toast, items, loading, saveData, deleteData } = useSupportTeam(activeIndex);

    // 2. Reference Data (หมวดหมู่ปัญหา) - สำหรับ Lookup & Dropdown
    const { items: issueItems } = useIssues(0);

    // [Performance Optimization] สร้าง Map เตรียมไว้ให้ Table (Lookup O(1))
    const issueCategoryMap = useMemo(() => {
        return createDataMap(issueItems, 'id', 'title');
    }, [issueItems]);

    // แปลงเป็น Options สำหรับ Dropdown ใน Dialog
    const issueCategoryOptions = useMemo(() => {
        return issueItems.map(issue => ({
            label: issue.title, 
            value: issue.id
        }));
    }, [issueItems]);

    // TODO: รอ API ดึงรายชื่อ User จริงๆ (ตอนนี้ Mock ไว้ก่อน)
    const adminUserOptions: {label: string, value: any}[] = []; 
    
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<SupportTeamData | null>(null);

    const tabItems = [
        { label: 'ວິຊາການ' },
        { label: 'ຜູ້ຄຸ້ມຄອງ'},
        { label: 'ຜູ້ຮ້ອງຂໍ' }
    ];

    const config = useMemo(() => {
        const currentLabel = tabItems[activeIndex]?.label || '';
        return {
            header: `ການຈັດການ${currentLabel}`,
            dialogHeader: `ເພີ່ມ${currentLabel}`,
            label: `ຊື່${currentLabel}`
        };
    }, [activeIndex, tabItems]);

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
    const openEdit = (item: SupportTeamData) => { setSelectedItem(item); setDialogVisible(true); };
    
    const handleSave = async (payload: CreateSupportTeamPayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຂໍ້ມູນ "${item.name || 'ລາຍການນີ້'}" ແທ້ບໍ່?`,
            header: 'ຢືນຢັນການລົບ',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'ຕົກລົງ', rejectLabel: 'ຍົກເລີກ', acceptClassName: 'p-button-danger',
            accept: () => deleteData(item)
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
            <Toast ref={toast} />
            <ConfirmDialog />
            <TabMenu 
                model={tabItems} 
                activeIndex={activeIndex} 
                onTabChange={(e) => setActiveIndex(e.index)} 
                className="mb-4 custom-tabmenu" 
            />

            <SupportTeamTable 
                items={items} 
                loading={loading} 
                header={renderHeader()} 
                globalFilter={globalFilter} 
                label={config.label}
                activeTab={activeIndex} 
                onEdit={openEdit}
                onDelete={confirmDelete}
                // ส่ง Map ไปให้ Table ทำ Lookup
                issueCategoryMap={issueCategoryMap} 
            />

            <SupportTeamCreateDialog 
                visible={isDialogVisible} 
                onHide={() => setDialogVisible(false)} 
                onSave={handleSave} 
                headerTitle={config.dialogHeader} 
                inputLabel={config.label} 
                isSaving={isSaving}
                editData={selectedItem}
                activeTab={activeIndex} 
                issueOptions={issueCategoryOptions} 
                userOptions={adminUserOptions}      
            />
        </div>
    );
}