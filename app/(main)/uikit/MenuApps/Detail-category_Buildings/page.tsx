'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { MenuItem } from 'primereact/menuitem';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import ManagementTable from './ManagementTable';
import BuildingCreateDialog from './BuildingCreateDialog';
import { useBuilding } from '../hooks/useBuilding';
import { BuildingData, CreateBuildingPayload } from '../types';

const CUSTOM_TAB_CSS = `
    .custom-tabmenu .p-menuitem-text { color: #000000 !important; transition: color 0.2s; }
    .custom-tabmenu .p-menuitem-link:hover .p-menuitem-text { color: var(--primary-color) !important; }
    .custom-tabmenu .p-highlight .p-menuitem-text { color: var(--primary-color) !important; font-weight: bold; }
`;

export default function BuildingsPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState<number>(0);
    
    const { toast, items, loading, buildingOptions, saveData, deleteData } = useBuilding(activeIndex);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<BuildingData | null>(null);

    // เมนู (ไม่มี Icon)
    const tabItems: MenuItem[] = [
        { label: 'ຕຶກ/ອາຄານ' },
        { label: 'ລະດັບຊັ້ນ' },
        { label: 'ຫ້ອງ' }
    ];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    const { tableHeaderTitle, columnNameHeader } = useMemo(() => {
        if (activeIndex === 0) return { tableHeaderTitle: 'ຈັດການຕຶກ/ອາຄານ', columnNameHeader: 'ຊື່ຕຶກ/ອາຄານ' };
        if (activeIndex === 1) return { tableHeaderTitle: 'ຈັດການລະດັບຊັ້ນ', columnNameHeader: 'ລະຫັດລະດັບຊັ້ນ' };
        return { tableHeaderTitle: 'ຈັດການຫ້ອງ', columnNameHeader: 'ຊື່ຫ້ອງ' };
    }, [activeIndex]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: BuildingData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSave = async (payload: CreateBuildingPayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: BuildingData) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລຶບ "${item.name}" ແທ້ບໍ່?`,
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
            <Toast ref={toast} />
            <ConfirmDialog />
            
            <div className="mb-4">
                <TabMenu 
                    model={tabItems} 
                    activeIndex={activeIndex} 
                    onTabChange={(e) => setActiveIndex(e.index)} 
                    className="custom-tabmenu" /* ใช้งาน CSS Class ที่แก้ใหม่ */
                />
            </div>

            <ManagementTable 
                items={items}
                loading={loading}
                header={renderHeader()}
                globalFilter={globalFilter}
                nameColumnHeader={columnNameHeader}
                activeTab={activeIndex}
                onEdit={openEdit}
                onDelete={confirmDelete}
            />

            <BuildingCreateDialog 
                visible={isDialogVisible} 
                onHide={() => setDialogVisible(false)} 
                onSave={handleSave} 
                itemNameLabel={columnNameHeader}
                activeTab={activeIndex}
                buildingOptions={buildingOptions}
                isSaving={isSaving}
                editData={selectedItem}
            />
        </div>
    );
}