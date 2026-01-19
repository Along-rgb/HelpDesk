// src/uikit/MenuApps/Detail-category_Buildings/BuildingCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';
import axiosClientsHelpDesk from '../../../../../config/axiosClientsHelpDesk'; 
import { BuildingData, CreateBuildingPayload } from '../types';

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
    const [code, setCode] = useState(''); // ใช้สำหรับ Description ใน Tab ห้อง
    const [status, setStatus] = useState<string>('ACTIVE');
    
    // State สำหรับ Dropdown
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<BuildingData | null>(null);
    const [levelOptions, setLevelOptions] = useState<BuildingData[]>([]);

    const [submitted, setSubmitted] = useState(false);

    // เช็ค Tab
    const isLevelTab = activeTab === 1;
    const isRoomTab = activeTab === 2;

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                // Edit Mode
                setName(editData.name);
                setCode(editData.code);
                setStatus(editData.status);

                if (isLevelTab) { 
                    const parent = buildingOptions.find(b => b.id === editData.parentId);
                    setSelectedBuilding(parent || null);
                } else if (isRoomTab) {
                    // กรณีแก้ไขห้อง: ต้อง Reset หรือหา Logic ดึงตึก/ชั้น ของห้องนั้นๆ มาแสดง
                    // เบื้องต้น Reset เพื่อให้เลือกใหม่ หรือต้องมีข้อมูล parentId เชื่อมโยง
                    setSelectedBuilding(null); 
                    setSelectedLevel(null);
                }
            } else {
                // New Mode
                setName('');
                setCode('');
                setStatus('ACTIVE');
                setSelectedBuilding(null);
                setSelectedLevel(null);
                setLevelOptions([]);
            }
        }
    }, [visible, editData, buildingOptions, isLevelTab, isRoomTab]);

    // Fetch Levels เมื่อเลือก Building (สำหรับ Tab ห้อง)
    useEffect(() => {
        if (isRoomTab && selectedBuilding) {
            const fetchLevels = async () => {
                try {
                    const res = await axiosClientsHelpDesk.get('/buildings', {
                        params: { type: 'LEVEL', status: 'ACTIVE', parentId: selectedBuilding.id }
                    });
                    if (res.data && Array.isArray(res.data.data)) {
                        setLevelOptions(res.data.data);
                    } else if (Array.isArray(res.data)) {
                        setLevelOptions(res.data);
                    }
                } catch (err) {
                    console.error("Error fetching levels:", err);
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
            name, // สำหรับ Tab ห้อง ค่านี้คือ "หมายเลขห้อง"
            code, // สำหรับ Tab ห้อง ค่านี้คือ "คำอธิบาย"
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

    // --- จัดการ Label ตาม Requirement ---
    let mainInputLabel = itemNameLabel;
    let descriptionLabel = "ລາຍລະອຽດ (ວ່າງໄດ້)";

    if (isRoomTab) {
        // Requirement: เพิ่มส่วนของ ໝາຍເລກຫ້ອງ (ใช้แทน Name) และ ลบ ຊື່ຫ້ອງ ออก
        mainInputLabel = "ໝາຍເລກຫ້ອງ"; 
        
        // Requirement: แก้ไขส่วนของ ລະຫັດຫ້ອງ เป็น คำอธิบาย
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
                
                {/* 1. เลือกตึก/อาคาร */}
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

                {/* 2. เลือกระดับชั้น (Requirement: เพิ่มส่วนของ ລະດັບຊັ້ນ) */}
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

                {/* 3. ช่องกรอกหลัก (Requirement: ໝາຍເລກຫ້ອງ แทน ຊື່ຫ້ອງ) */}
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

                {/* 4. ช่องรอง (Requirement: แก้ไข ລະຫັດຫ້ອງ เป็น คำอธิบาย) */}
                <div className="field mb-0">
                    <label htmlFor="code" className="font-bold block mb-2">{descriptionLabel}</label>
                    <InputText id="code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full" />
                </div>

                {/* 5. สถานะ */}
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