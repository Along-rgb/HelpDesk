// src/uikit/MenuApps/Detail-category_Buildings/BuildingCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk'; 
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
}

export default function BuildingCreateDialog({ visible, onHide, onSave, itemNameLabel, activeTab, buildingOptions, isSaving, editData }: Props) {
    const [name, setName] = useState('');
    const [code, setCode] = useState(''); 
    const [status, setStatus] = useState<string>('ACTIVE');
    
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<BuildingData | null>(null);
    const [levelOptions, setLevelOptions] = useState<BuildingData[]>([]);

    const [submitted, setSubmitted] = useState(false);

    const isLevelTab = activeTab === BuildingTabs.LEVEL;
    const isRoomTab = activeTab === BuildingTabs.ROOM;

    // Reset Form
    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setName(editData.name);
                setCode(editData.code);
                setStatus(editData.status);

                if (isLevelTab) { 
                    const parent = buildingOptions.find(b => b.id === editData.parentId);
                    setSelectedBuilding(parent || null);
                } else if (isRoomTab) {
                    // TODO: ຖ້າຕ້ອງການໃຫ້ Auto Select Building ເວລາ Edit Room
                    // ຕ້ອງມີ buildingId ໃນ editData ຫຼື API ຕ້ອງສົ່ງ hierarchy ມາ
                    // ຕອນນີ້ໃຫ້ Reset ເພື່ອປ້ອງກັນຂໍ້ມູນຜິດພາດ
                    setSelectedBuilding(null); 
                    setSelectedLevel(null);
                }
            } else {
                setName('');
                setCode('');
                setStatus('ACTIVE');
                setSelectedBuilding(null);
                setSelectedLevel(null);
                setLevelOptions([]);
            }
        }
    }, [visible, editData, buildingOptions, isLevelTab, isRoomTab]);

    // Fetch Levels Logic (Improved)
    useEffect(() => {
        if (isRoomTab && selectedBuilding) {
            const fetchLevels = async () => {
                try {
                    const res = await axiosClientsHelpDesk.get('/buildings', {
                        params: { type: 'LEVEL', status: 'ACTIVE', parentId: selectedBuilding.id }
                    });
                    const levels = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
                    setLevelOptions(levels);
                } catch (err) {
                    console.error("Error fetching levels:", err);
                    setLevelOptions([]);
                }
            };
            fetchLevels();
        } else {
            setLevelOptions([]);
        }
    }, [selectedBuilding, isRoomTab]);

    const handleSave = () => {
        setSubmitted(true);
        if (!name.trim()) return;
        
        if (isLevelTab && !selectedBuilding) return;
        if (isRoomTab && (!selectedBuilding || !selectedLevel)) return;

        let finalParentId = null;
        if (isLevelTab) {
            finalParentId = selectedBuilding?.id;
        } else if (isRoomTab) {
            finalParentId = selectedLevel?.id;
        }

        onSave({ 
            name, 
            code, 
            status,
            parentId: finalParentId || null
        });
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" onClick={onHide} className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50" disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} className="bg-indigo-600 border-indigo-600" loading={isSaving} />
        </div>
    );

    let mainInputLabel = itemNameLabel;
    let descriptionLabel = "ລາຍລະອຽດ (ວ່າງໄດ້)";

    if (isRoomTab) {
        mainInputLabel = "ໝາຍເລກຫ້ອງ"; 
        descriptionLabel = "ຄຳອະທິບາຍ"; 
    }

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
                
                {(isLevelTab || isRoomTab) && (
                    <div className="field mb-0">
                        <label htmlFor="parentBuilding" className="font-bold block mb-2">
                            ຕຶກ/ອາຄານ <span className="text-red-500">*</span>
                        </label>
                        <Dropdown 
                            id="parentBuilding"
                            value={selectedBuilding} 
                            onChange={(e) => { setSelectedBuilding(e.value); setSelectedLevel(null); }} 
                            options={buildingOptions} 
                            optionLabel="name" 
                            placeholder="ເລືອກຕຶກ/ອາຄານ" 
                            className={submitted && !selectedBuilding ? 'p-invalid w-full' : 'w-full'}
                            filter 
                        />
                        {submitted && !selectedBuilding && <small className="text-red-500">ກະລຸນາເລືອກຕຶກ/ອາຄານ</small>}
                    </div>
                )}

                {isRoomTab && (
                    <div className="field mb-0">
                        <label htmlFor="parentLevel" className="font-bold block mb-2">
                            ລະດັບຊັ້ນ <span className="text-red-500">*</span>
                        </label>
                        <Dropdown 
                            id="parentLevel"
                            value={selectedLevel} 
                            onChange={(e) => setSelectedLevel(e.value)} 
                            options={levelOptions} 
                            optionLabel="name" 
                            placeholder="ເລືອກລະດັບຊັ້ນ" 
                            className={submitted && !selectedLevel ? 'p-invalid w-full' : 'w-full'}
                            disabled={!selectedBuilding}
                            emptyMessage="ບໍ່ພົບຂໍ້ມູນລະດັບຊັ້ນ (ກະລຸນາເລືອກຕຶກກ່ອນ)"
                            filter
                        />
                        {submitted && !selectedLevel && <small className="text-red-500">ກະລຸນາເລືອກລະດັບຊັ້ນ</small>}
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

                <div className="field">
                    <label className="font-bold block mb-2">ສະຖານະ:</label>
                    <div className="flex gap-4">
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusActive" name="status" value="ACTIVE" onChange={(e) => setStatus(e.value)} checked={status === 'ACTIVE'} />
                            <label htmlFor="statusActive" className="ml-2 cursor-pointer">ໃຊ້ງານ</label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusInactive" name="status" value="INACTIVE" onChange={(e) => setStatus(e.value)} checked={status === 'INACTIVE'} />
                            <label htmlFor="statusInactive" className="ml-2 cursor-pointer">ບໍ່ໃຊ້ງານ</label>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}