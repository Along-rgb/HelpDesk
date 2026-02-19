// src/uikit/MenuApps/Detail-category_SupportTeam/SupportTeamCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';       
import { MultiSelect } from 'primereact/multiselect'; 
import { SupportTeamData, CreateSupportTeamPayload, SupportTeamTabs } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateSupportTeamPayload) => void;
    headerTitle: string;
    inputLabel: string;
    isSaving: boolean;
    editData?: SupportTeamData | null;
    activeTab: number;
    issueOptions?: { label: string, value: any }[];
    userOptions?: { label: string, value: any }[];
}

interface FormState {
    name: string;
    description: string;
    status: string;
    issueCategoryId: number | null;
    assignedAdminIds: number[];
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
    
    // [Type Safe]
    const initialFormState: FormState = {
        name: '',
        description: '',
        status: 'ACTIVE',
        issueCategoryId: null,
        assignedAdminIds: [] 
    };

    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitted, setSubmitted] = useState(false);
    const isSupportTeamTab = activeTab === SupportTeamTabs.SUPPORT_TEAM; // ທີມຄຸ້ມຄອງ

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setForm({
                    name: editData.name || '',
                    description: editData.description || '',
                    status: editData.status || 'ACTIVE',
                    issueCategoryId: editData.issueCategoryId || null,
                    assignedAdminIds: editData.assignedAdmins ? editData.assignedAdmins.map(a => a.id) : []
                });
            } else {
                setForm(initialFormState);
            }
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);

        // Validation
        if (isSupportTeamTab) {
            if (!form.issueCategoryId || form.assignedAdminIds.length === 0) return;
        } else {
            if (!form.name.trim()) return;
        }

        const payload: CreateSupportTeamPayload = {
            ...form,
            name: isSupportTeamTab ? '' : form.name,
            issueCategoryId: form.issueCategoryId || undefined,
            assignedAdminIds: form.assignedAdminIds
        };

        onSave(payload);
    };

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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
                
                {isSupportTeamTab ? (
                    <>
                        <div className="field mb-0">
                            <label htmlFor="supportteam-issueCategory" className="font-bold block mb-2">
                                ໝວດບັນຫາ <span className="text-red-500">*</span>
                            </label>
                            <Dropdown 
                                id="supportteam-issueCategory"
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
                            <label htmlFor="supportteam-assignedAdmins" className="font-bold block mb-2">
                                ເລືອກຜູ້ຈະຮັບຜິຊອບຫນ້າວຽກ <span className="text-red-500">*</span>
                            </label>
                            <MultiSelect 
                                id="supportteam-assignedAdmins"
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
            </div>
        </Dialog>
    );
}