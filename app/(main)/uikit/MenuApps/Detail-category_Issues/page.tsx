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
import { useIssues } from '../hooks/useIssues';
import { IssueData, CreateIssuePayload } from '../types';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

export default function IssuesPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState<number>(0);

    // Main Data
    const { toast, items, saveData, deleteData } = useIssues(activeIndex);
    
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
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<IssueData | null>(null);

    const tabItems = [{ label: 'ໝວດໝູ່' }, { label: 'ລາຍການຫົວຂໍ້' }];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    const { tableHeaderTitle, columnNameHeader } = useMemo(() => {
        return activeIndex === 0 
            ? { tableHeaderTitle: 'ຈັດການໝວດໝູ່ການແຈ້ງບັນຫາ', columnNameHeader: 'ຊື່ໝວດໝູ່' }
            : { tableHeaderTitle: 'ຈັດການລາຍການຫົວຂໍ້', columnNameHeader: 'ຊື່ລາຍການຫົວຂໍ້' };
    }, [activeIndex]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: IssueData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSave = async (payload: CreateIssuePayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
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

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl text-900">{tableHeaderTitle}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ.." className="p-inputtext-sm w-full md:w-15rem" />
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
            <div className="mb-4">
                <TabMenu model={tabItems} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-tabmenu" />
            </div>

            <IssuesTable 
                items={items}
                header={renderHeader()}
                globalFilter={globalFilter}
                nameColumnHeader={columnNameHeader}
                activeTab={activeIndex}
                onEdit={openEdit}
                onDelete={confirmDelete}
                // [Clean Code] ส่ง Map ไปแทน Array เพื่อความเร็ว
                categoryMap={categoryMap}
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
            />
        </div>
    );
}