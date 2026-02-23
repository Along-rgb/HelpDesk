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
import ServiceRequestIconTable from './ServiceRequestIconTable';
import ServiceRequestIconCreateDialog from './ServiceRequestIconCreateDialog';
import { useServiceRequest } from '../hooks/useServiceRequest';
import { useServiceRequestIcons } from '../hooks/useServiceRequestIcons';
import { useSupportTeam } from '../hooks/useSupportTeam';
import { ServiceRequestData, CreateServiceRequestPayload, ServiceRequestTabs } from '../types';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';

export default function ServiceRequestsPage() {
    const searchParams = useSearchParams();
    const [activeIndex, setActiveIndex] = useState(ServiceRequestTabs.CATEGORY);

    const { toast, items, saveData, deleteData } = useServiceRequest(activeIndex);
    const { items: iconItems, saveData: saveIconData, deleteData: deleteIconData } = useServiceRequestIcons(activeIndex);
    const { items: supportTeamItems } = useSupportTeam(1);

    const supportTeamMap = useMemo(() => createDataMap(supportTeamItems, 'id', 'name'), [supportTeamItems]);
    const supportTeamOptions = useMemo(() => supportTeamItems.map(t => ({ label: t.name, value: t.id })), [supportTeamItems]);
    const iconMap = useMemo(() => new Map(iconItems.map(i => [i.id, i.iconUrl])), [iconItems]);
    const iconOptions = useMemo(() => iconItems.map(i => ({ label: 'ຮູບໄອຄອນ', value: i.id, iconUrl: i.iconUrl })), [iconItems]);
    
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
    const [isIconDialogVisible, setIconDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<ServiceRequestData | null>(null);
    const [selectedIconItem, setSelectedIconItem] = useState<import('../types').IconItemData | null>(null);

    const tabItems = [{ label: 'ໝວດໝູ່' }, { label: 'ລາຍການຫົວຂໍ້' }, { label: 'ເພີ່ມໄອຄອນ' }];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    const config = useMemo(() => {
        if (activeIndex === ServiceRequestTabs.CATEGORY)
            return { header: 'ຈັດການຂໍ້ມູນໝວດໝູ່', dialogHeader: 'ເພີ່ມໝວດໝູ່', label: 'ຊື່ໝວດໝູ່' };
        if (activeIndex === ServiceRequestTabs.TOPIC)
            return { header: 'ຈັດການຂໍ້ມູນລາຍການຫົວຂໍ້', dialogHeader: 'ເພີ່ມລາຍການ', label: 'ຊື່ລາຍການຫົວຂໍ້' };
        return { header: 'ເພີ່ມຮູປໄອຄອນ', dialogHeader: 'ເພີ່ມຮູປໄອຄອນ', label: '' };
    }, [activeIndex]);

    const openNew = () => { setSelectedItem(null); setDialogVisible(true); };
    const openEdit = (item: ServiceRequestData) => { setSelectedItem(item); setDialogVisible(true); };
    const openIconNew = () => { setSelectedIconItem(null); setIconDialogVisible(true); };
    const openIconEdit = (item: import('../types').IconItemData) => { setSelectedIconItem(item); setIconDialogVisible(true); };

    const handleSave = async (payload: CreateServiceRequestPayload) => {
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

    const confirmDelete = (item: ServiceRequestData) => {
        confirmDialog({
            message: `ທ່ານຕ້ອງການລຶບ "${item.name}" ແທ້ບໍ່?`,
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
            <h5 className="m-0 font-bold text-xl text-900">{config.header}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ..." className="p-inputtext-sm w-full md:w-15rem" />
                </span>
                {activeIndex === ServiceRequestTabs.ICON ? (
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

            {activeIndex === ServiceRequestTabs.ICON ? (
                <>
                    <ServiceRequestIconTable
                        items={iconItems}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        onEdit={openIconEdit}
                        onDelete={confirmIconDelete}
                    />
                    <ServiceRequestIconCreateDialog
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
                    <ServiceRequestTable
                        items={items}
                        header={renderHeader()}
                        globalFilter={globalFilter}
                        label={config.label}
                        activeTab={activeIndex}
                        onEdit={openEdit}
                        onDelete={confirmDelete}
                        categoryMap={categoryMap}
                        supportTeamMap={supportTeamMap}
                        iconMap={iconMap}
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
                        supportTeamOptions={supportTeamOptions}
                        iconOptions={iconOptions}
                    />
                </>
            )}
        </div>
    );
}