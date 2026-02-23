// src/uikit/MenuApps/Detail-category_Buildings/BuildingCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { BuildingData, CreateBuildingPayload, BuildingTabs } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateBuildingPayload) => void;
    itemNameLabel: string;
    activeTab: number;
    buildingOptions: BuildingData[];
    isSaving: boolean;
    editData?: BuildingData | null;
    saveButtonDisabled?: boolean;
}

export default function BuildingCreateDialog({ visible, onHide, onSave, itemNameLabel, activeTab, buildingOptions, isSaving, editData, saveButtonDisabled = false }: Props) {
    const [name, setName] = useState('');
    const [code, setCode] = useState(''); 
    const [status, setStatus] = useState<string>('ACTIVE');
    
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

    const [submitted, setSubmitted] = useState(false);

    const isLevelTab = activeTab === BuildingTabs.LEVEL;

    // ເມື່ອເປີດ Dialog: ຖ້າແກ້ໄຂ ໃຫ້ດຶງຂໍ້ມູນຈາກ editData ມາໃສ່ຟອມ, ຖ້າເພີ່ມໃໝ່ ໃຫ້ລ້າງຟອມ
    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setName(editData.name ?? '');
                setCode(editData.code ?? '');
                setStatus(editData.status ?? 'ACTIVE');

                if (isLevelTab) {
                    const parent = buildingOptions.find(b => b.id === editData.parentId);
                    setSelectedBuilding(parent || null);
                }
            } else {
                setName('');
                setCode('');
                setStatus('ACTIVE');
                setSelectedBuilding(null);
            }
        }
    }, [visible, editData, buildingOptions, isLevelTab]);

    const handleSave = () => {
        setSubmitted(true);
        if (!name.trim()) return;

        if (isLevelTab && !selectedBuilding) return;

        let finalParentId: number | null = null;
        if (isLevelTab) {
            finalParentId = selectedBuilding?.id ?? editData?.parentId ?? null;
        }

        const payload: CreateBuildingPayload = {
            name: name.trim(),
            code: code?.trim() ?? '',
            status: status || 'ACTIVE'
        };
        if (finalParentId != null) {
            payload.parentId = finalParentId;
        }
        onSave(payload);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" onClick={onHide} className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50" disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} className="bg-indigo-600 border-indigo-600" loading={isSaving} disabled={saveButtonDisabled} />
        </div>
    );

    let mainInputLabel = itemNameLabel;
    let descriptionLabel = "ລາຍລະອຽດ (ວ່າງໄດ້)";

    return (
        <Dialog 
            header={editData ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມຂໍ້ມູນ'} 
            visible={visible} 
            style={{ width: '50vw' }} 
            breakpoints={{ '960px': '75vw', '641px': '100vw' }} 
            onHide={onHide} 
            footer={renderFooter()} 
            maximizable 
            modal 
            className="p-fluid"
        >
            <div className="flex flex-column gap-3">
                
                {isLevelTab && (
                    <div className="field mb-0">
                        <label htmlFor="parentBuilding" className="font-bold block mb-2">
                            ຕຶກ/ອາຄານ <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            id="parentBuilding"
                            value={selectedBuilding}
                            onChange={(e) => { setSelectedBuilding(e.value); }}
                            options={buildingOptions}
                            optionLabel="name"
                            placeholder="ເລືອກຕຶກ/ອາຄານ"
                            className={submitted && !selectedBuilding ? 'p-invalid w-full' : 'w-full'}
                            filter
                        />
                        {submitted && !selectedBuilding && <small className="text-red-500">ກະລຸນາເລືອກຕຶກ/ອາຄານ</small>}
                    </div>
                )}

                <div className="field mb-0">
                    <label htmlFor="name" className="font-bold block mb-2">
                        {mainInputLabel} <span className="text-red-500">*</span>
                    </label>
                    <InputText 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className={submitted && !name.trim() ? 'p-invalid w-full' : 'w-full'}
                        autoFocus
                    />
                    {submitted && !name.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {mainInputLabel}</small>}
                </div>

                <div className="field mb-0">
                    <label htmlFor="code" className="font-bold block mb-2">{descriptionLabel}</label>
                    <InputText id="code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full" />
                </div>
            </div>
        </Dialog>
    );
}