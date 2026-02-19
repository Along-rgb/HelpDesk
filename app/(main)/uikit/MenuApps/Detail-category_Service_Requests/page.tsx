// src/uikit/MenuApps/Detail-category_Service_Requests/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import ServiceRequestCreateDialog from './ServiceRequestCreateDialog';
import ServiceRequestTable from './ServiceRequestTable';
import { useServiceRequest } from '../hooks/useServiceRequest';
import { ServiceRequestData, CreateServiceRequestPayload, ServiceRequestTabs } from '../types';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

export default function ServiceRequestsPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState(ServiceRequestTabs.CATEGORY);

    const { toast, items, saveData, deleteData } = useServiceRequest(activeIndex);
    
    // Fetch categories for lookup
    const { items: categoryItemsFromHook } = useServiceRequest(ServiceRequestTabs.CATEGORY);
    const categoryItems = activeIndex === ServiceRequestTabs.CATEGORY ? items : categoryItemsFromHook;

    // [Optimization] Create Map for O(1) Lookup
    const categoryMap = useMemo(() => {
        return createDataMap(categoryItems, 'id', 'name');
    }, [categoryItems]);

    const categoryOptions = useMemo(() => {
        return categoryItems.map(c => ({ label: c.name, value: c.id }));
    }, [categoryItems]);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<ServiceRequestData | null>(null);

    const tabItems = [{ label: 'ໝວດໝູ່' }, { label: 'ລາຍການຫົວຂໍ້' }];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    const config = useMemo(() => {
        return activeIndex === ServiceRequestTabs.CATEGORY
            ? { header: 'ຈັດການຂໍ້ມູນໝວດໝູ່', dialogHeader: 'ເພີ່ມໝວດໝູ່', label: 'ຊື່ໝວດໝູ່' }
            : { header: 'ຈັດການຂໍ້ມູນລາຍການຫົວຂໍ້', dialogHeader: 'ເພີ່ມລາຍການ', label: 'ຊື່ລາຍການຫົວຂໍ້' };
    }, [activeIndex]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: ServiceRequestData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSave = async (payload: CreateServiceRequestPayload) => {
        setSaving(true);
        const success = await saveData(payload, selectedItem?.id);
        if (success) setDialogVisible(false);
        setSaving(false);
    };

    const confirmDelete = (item: ServiceRequestData) => {
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
            <h5 className="m-0 font-bold text-xl text-900">{config.header}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ..." className="p-inputtext-sm w-full md:w-15rem" />
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

            <ServiceRequestTable
                items={items}
                header={renderHeader()}
                globalFilter={globalFilter}
                label={config.label}
                activeTab={activeIndex}
                onEdit={openEdit}
                onDelete={confirmDelete}
                categoryMap={categoryMap} // Pass Map
            />

            <ServiceRequestCreateDialog
                visible={isDialogVisible}
                onHide={() => setDialogVisible(false)}
                onSave={handleSave}
                headerTitle={config.dialogHeader}
                inputLabel={config.label}
                isSaving={isSaving}
                editData={selectedItem}
                activeTab={activeIndex}
                categoryOptions={categoryOptions}
            />
        </div>
    );
}