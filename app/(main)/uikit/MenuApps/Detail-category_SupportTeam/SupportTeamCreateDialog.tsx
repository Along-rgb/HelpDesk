// src/uikit/MenuApps/Detail-category_SupportTeam/SupportTeamCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';       
import { MultiSelect } from 'primereact/multiselect'; 
import { SupportTeamData, CreatePayload } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreatePayload) => void;
    headerTitle: string;
    inputLabel: string;
    isSaving: boolean;
    editData?: SupportTeamData | null;
    activeTab: number;
    issueOptions?: { label: string, value: any }[];
    userOptions?: { label: string, value: any }[];
}

export default function SupportTeamCreateDialog({ 
    visible, 
    onHide, 
    onSave, 
    headerTitle, 
    inputLabel, 
    isSaving, 
    editData, 
    activeTab, 
    issueOptions = [], 
    userOptions = [] 
}: Props) {
    
    // [Clean Code] รวม State ทั้งหมดไว้ใน Object เดียว
    // และกำหนด assignedAdminIds เริ่มต้นเป็น [] แทน null เพื่อแก้ TypeScript Error
    const initialFormState = {
        name: '',
        description: '',
        status: 'ACTIVE',
        issueCategoryId: null as any,
        assignedAdminIds: [] as any[] 
    };

    const [form, setForm] = useState(initialFormState);
    const [submitted, setSubmitted] = useState(false);
    const isSystemAdminTab = activeTab === 1;

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                // Map ข้อมูลเดิมเข้า Form
                setForm({
                    name: editData.name || '',
                    description: editData.description || '',
                    status: editData.status || 'ACTIVE',
                    issueCategoryId: editData.issueCategoryId || null,
                    // ใช้ || [] เพื่อกันไม่ให้ค่าเป็น null ซึ่งจะทำให้ TypeScript แจ้งเตือน
                    assignedAdminIds: editData.assignedAdmins?.map(a => a.id) || []
                });
            } else {
                setForm(initialFormState); // Reset เป็นค่าเริ่มต้น
            }
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);

        // Validation Logic
        if (isSystemAdminTab) {
            if (!form.issueCategoryId || form.assignedAdminIds.length === 0) return;
        } else {
            if (!form.name.trim()) return;
        }

        // ส่งข้อมูลกลับ (ใช้ Object Spread เพื่อความสั้นกระชับ)
        onSave({ 
            ...form,
            name: isSystemAdminTab ? '' : form.name,
            // ส่ง assignedAdminIds เป็น Array เสมอ (ไม่ส่ง null)
            assignedAdminIds: form.assignedAdminIds
        });
    };

    // Helper Function: สำหรับอัปเดตค่าใน Form แบบบรรทัดเดียวจบ
    const updateField = (key: keyof typeof form, value: any) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" onClick={onHide} className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50" disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} className="bg-indigo-600 border-indigo-600" loading={isSaving} />
        </div>
    );

    return (
        <Dialog 
            header={editData ? `ແກ້ໄຂ${headerTitle.replace('ເພີ່ມ', '')}` : headerTitle} 
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
                
                {/* Conditional Rendering ตาม Tab */}
                {isSystemAdminTab ? (
                    <>
                        <div className="field mb-0">
                            <label className="font-bold block mb-2">
                                ໝວດບັນຫາ <span className="text-red-500">*</span>
                            </label>
                            <Dropdown 
                                value={form.issueCategoryId} 
                                options={issueOptions} 
                                onChange={(e) => updateField('issueCategoryId', e.value)} 
                                placeholder="ເລືອກໝວດບັນຫາ"
                                className={submitted && !form.issueCategoryId ? 'p-invalid' : ''}
                                appendTo={typeof document !== 'undefined' ? document.body : 'self'}
                            />
                            {submitted && !form.issueCategoryId && <small className="text-red-500">ກະລຸນາເລືອກໝວດບັນຫາ</small>}
                        </div>

                        <div className="field mb-0">
                            <label className="font-bold block mb-2">
                                ເລືອກຜູ້ຈະຮັບຜິຊອບຫນ້າວຽກ <span className="text-red-500">*</span>
                            </label>
                            <MultiSelect 
                                value={form.assignedAdminIds} 
                                options={userOptions} 
                                onChange={(e) => updateField('assignedAdminIds', e.value)} 
                                placeholder="ເລືອກຜູ້ປະຕິບັດວຽກງານ" 
                                display="chip"
                                filter 
                                emptyMessage="ບໍ່ພົບຂໍ້ມູນ"
                                className={submitted && form.assignedAdminIds.length === 0 ? 'p-invalid' : ''}
                                appendTo={typeof document !== 'undefined' ? document.body : 'self'}
                            />
                            {submitted && form.assignedAdminIds.length === 0 && <small className="text-red-500">ກະລຸນາເລືອກຜູ້ຮັບຜິດຊອບ</small>}
                        </div>
                    </>
                ) : (
                    <div className="field mb-0">
                        <label htmlFor="name" className="font-bold block mb-2">
                            {inputLabel} <span className="text-red-500">*</span>
                        </label>
                        <InputText 
                            id="name" 
                            value={form.name} 
                            onChange={(e) => updateField('name', e.target.value)} 
                            className={submitted && !form.name.trim() ? 'p-invalid w-full' : 'w-full'}
                            autoFocus 
                        />
                        {submitted && !form.name.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {inputLabel}</small>}
                    </div>
                )}

                <div className="field mb-0">
                    <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
                    <InputText id="description" value={form.description} onChange={(e) => updateField('description', e.target.value)} className="w-full" />
                </div>

                <div className="field">
                    <label className="font-bold block mb-2">ສະຖານະ:</label>
                    <div className="flex gap-4">
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusActive" name="status" value="ACTIVE" onChange={(e) => updateField('status', e.value)} checked={form.status === 'ACTIVE'} />
                            <label htmlFor="statusActive" className="ml-2 cursor-pointer">ໃຊ້ງານ</label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusInactive" name="status" value="INACTIVE" onChange={(e) => updateField('status', e.value)} checked={form.status === 'INACTIVE'} />
                            <label htmlFor="statusInactive" className="ml-2 cursor-pointer">ບໍ່ໃຊ້ງານ</label>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}