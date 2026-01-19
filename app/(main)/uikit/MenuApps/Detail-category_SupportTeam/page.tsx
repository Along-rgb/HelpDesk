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
import { SupportTeamData, CreatePayload } from '../types';

const CUSTOM_TAB_CSS = `
    .custom-tabmenu .p-menuitem-text { color: #000000 !important; transition: color 0.2s; }
    .custom-tabmenu .p-menuitem-link:hover .p-menuitem-text { color: var(--primary-color) !important; }
    .custom-tabmenu .p-highlight .p-menuitem-text { color: var(--primary-color) !important; font-weight: bold; }
`;

export default function SupportTeamPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState(0);

    const { toast, items, loading, saveData, deleteData } = useSupportTeam(activeIndex);

    // ✅ ดึงข้อมูลหมวดปัญหาจาก API (useIssues) มาใช้งานจริง
    const { items: issueItems } = useIssues(0);

    // ✅ แปลงข้อมูล IssueData -> Dropdown Option
    const issueCategoryOptions = useMemo(() => {
        return issueItems.map(issue => ({
            label: issue.title, 
            value: issue.id
        }));
    }, [issueItems]);

    // ✅ โครงสร้าง User Options (รอ API จริง)
    // ปล่อยเป็น Array ว่างไว้ก่อนตามที่แจ้ง
    const adminUserOptions: {label: string, value: any}[] = []; 
    
    // หากต้องการดึง API จริง ให้ทำ useEffect ตรงนี้:
    /*
    useEffect(() => {
         // fetchUsers().then(data => setAdminUserOptions(...));
    }, []);
    */

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
    const openEdit = (item: SupportTeamData) => { setSelectedItem(item); setDialogVisible(true); };
    
    const handleSave = async (payload: CreatePayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: SupportTeamData) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລົບຂໍ້ມູນ "${item.name}" แທ້ບໍ່?`, // แสดงชื่อถ้ามี
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
                activeTab={activeIndex} // ✅ ต้องส่ง activeTab ไปที่ Table ด้วย! (สำคัญ)
                onEdit={openEdit}
                onDelete={confirmDelete}
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