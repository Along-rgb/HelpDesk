// src/uikit/MenuApps/Detail-category_Buildings/page.tsx
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TabMenu } from 'primereact/tabmenu';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import ManagementTable, { getCascadeDeleteMessage } from './ManagementTable';
import BuildingCreateDialog from './BuildingCreateDialog';
import { useBuilding } from '../hooks/useBuilding';
import { BuildingData, CreateBuildingPayload, BuildingTabs } from '../types';
import { createDataMap } from '../utils/dataMapping';
import { CUSTOM_TAB_CSS } from '../constants/tabStyles';
import { useUserProfile } from '@/types/useUserProfile';

/** Role 2 (Admin) ບໍ່ມີສິດເຂົ້າເບິ່ງ ອາຄານສະຖານທີ່ — ເຫັນແຕ່ Role 1 (SuperAdmin). */
export default function BuildingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { roleId } = useUserProfile();
    const [activeIndex, setActiveIndex] = useState<number>(BuildingTabs.BUILDING);

    const { toast, items, buildingOptions, saveData, deleteData, deleteBuildingCascade } = useBuilding(activeIndex);

    const [isDialogVisible, setDialogVisible] = useState(false);
    const [isSaving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedItem, setSelectedItem] = useState<BuildingData | null>(null);
    const [addClickCount, setAddClickCount] = useState(0);
    const [addButtonDisabled, setAddButtonDisabled] = useState(false);
    const [saveButtonCooldown, setSaveButtonCooldown] = useState(false);
    const addCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tabItems = [{ label: 'ຕຶກ/ອາຄານ' }, { label: 'ລະດັບຊັ້ນ' }];

    useEffect(() => {
        if (roleId === 2) router.replace('/uikit/MenuApps');
    }, [roleId, router]);

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const index = Number(tabParam);
            if (index >= 0 && index < tabItems.length) setActiveIndex(index);
        }
    }, [searchParams]);

    useEffect(() => () => {
        if (addCooldownRef.current) clearTimeout(addCooldownRef.current);
        if (saveCooldownRef.current) clearTimeout(saveCooldownRef.current);
    }, []);

    // [Optimization] ສ້າງ Map ຂອງ Building ເພື່ອສົ່ງໃຫ້ Table lookup (O(1))
    const buildingMap = useMemo(() => {
        return createDataMap(Array.isArray(buildingOptions) ? buildingOptions : [], 'id', 'name');
    }, [buildingOptions]);

    const { tableHeaderTitle, columnNameHeader } = useMemo(() => {
        if (activeIndex === BuildingTabs.BUILDING) return { tableHeaderTitle: 'ຈັດການຕຶກ/ອາຄານ', columnNameHeader: 'ຊື່ຕຶກ/ອາຄານ' };
        return { tableHeaderTitle: 'ຈັດການລະດັບຊັ້ນ', columnNameHeader: 'ລະດັບຊັ້ນ' };
    }, [activeIndex]);

    if (roleId === 2) return null;

    const openNew = () => {
        if (addButtonDisabled) return;
        if (addClickCount >= 2) {
            toast?.current?.show({
                severity: 'warn',
                summary: 'ແຈ້ງເຕືອນ',
                detail: 'ກະລຸນາລໍຖ້າບໍ່ກົດຊ້ຳ',
                life: 2000
            });
            setAddButtonDisabled(true);
            if (addCooldownRef.current) clearTimeout(addCooldownRef.current);
            addCooldownRef.current = setTimeout(() => {
                setAddButtonDisabled(false);
                setAddClickCount(0);
                addCooldownRef.current = null;
            }, 2000);
            return;
        }
        setAddClickCount((c) => c + 1);
        setSelectedItem(null);
        setDialogVisible(true);
    };
    const openEdit = (item: BuildingData) => { setSelectedItem(item); setDialogVisible(true); };

    const handleSave = async (payload: CreateBuildingPayload) => {
        const id = selectedItem?.id;
        const nameNorm = (payload.name ?? '').trim().toLowerCase();
        const list = Array.isArray(items) ? items : [];

        const isDuplicate = list.some((row) => {
            if (row.id === id) return false;
            const rowName = (row.name ?? '').trim().toLowerCase();
            if (rowName !== nameNorm) return false;
            if (activeIndex === BuildingTabs.BUILDING) return true;
            if (activeIndex === BuildingTabs.LEVEL) {
                return (row.parentId ?? null) === (payload.parentId ?? null);
            }
            return true;
        });

        if (isDuplicate) {
            toast?.current?.show({
                severity: 'warn',
                summary: 'ແຈ້ງເຕືອນ',
                detail: 'ຂໍອະໄພຂໍ້ມູນຊຸດນີ້ມີແລ້ວກະລຸນາປ້ອນໃໝ່ອີກຄັ້ງ',
                life: 1500
            });
            setSaveButtonCooldown(true);
            if (saveCooldownRef.current) clearTimeout(saveCooldownRef.current);
            saveCooldownRef.current = setTimeout(() => {
                setSaveButtonCooldown(false);
                saveCooldownRef.current = null;
            }, 1500);
            return;
        }

        setSaving(true);
        const success = await saveData(payload, id);
        if (success) {
            setDialogVisible(false);
            setSelectedItem(null);
        }
        setSaving(false);
    };

    const onDelete = (item: BuildingData) => {
        if (activeIndex === BuildingTabs.BUILDING) {
            deleteBuildingCascade(item.id);
        } else {
            deleteData(item);
        }
    };

    const renderHeader = () => (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <h5 className="m-0 font-bold text-xl text-900">{tableHeaderTitle}</h5>
            <div className="flex align-items-center gap-2">
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" aria-hidden />
                    <InputText id="buildings-global-filter" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="ຄົ້ນຫາ.." className="p-inputtext-sm w-full md:w-15rem" aria-label="ຄົ້ນຫາ" />
                </span>
                <Button label="ເພີ່ມໃໝ່" icon="pi pi-plus" size="small" className="bg-indigo-600 border-indigo-600" onClick={openNew} disabled={addButtonDisabled} />
            </div>
        </div>
    );

    return (
        <div className="card p-4 surface-card shadow-2 border-round">
             <style>{CUSTOM_TAB_CSS}</style>
            <Toast ref={toast} position="top-center" />
            <div className="mb-4">
                <TabMenu model={tabItems} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="custom-tabmenu" />
            </div>

            <ManagementTable 
                items={Array.isArray(items) ? items : []}
                header={renderHeader()}
                globalFilter={globalFilter}
                nameColumnHeader={columnNameHeader}
                activeTab={activeIndex}
                onEdit={openEdit}
                onDelete={onDelete}
                buildingMap={buildingMap}
                buildingOptions={buildingOptions}
                deleteConfirmMessage={activeIndex === BuildingTabs.BUILDING ? getCascadeDeleteMessage : undefined}
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
                saveButtonDisabled={saveButtonCooldown}
            />
        </div>
    );
}