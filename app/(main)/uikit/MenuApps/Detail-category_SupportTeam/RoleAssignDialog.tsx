// src/uikit/MenuApps/Detail-category_SupportTeam/RoleAssignDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import type { UserRoleData, CreateUserRolePayload, UpdateUserRolePayload } from '../types';

export type RoleAssignSavePayload = CreateUserRolePayload | UpdateUserRolePayload;

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: RoleAssignSavePayload) => void;
    headerTitle: string;
    isSaving: boolean;
    editData?: UserRoleData | null;
    userOptions: { label: string; value: number }[];
    roleOptions: { label: string; value: number }[];
}

interface FormState {
    userId: number | null;
    roleId: number | null;
    description: string;
}

export default function RoleAssignDialog({
    visible,
    onHide,
    onSave,
    headerTitle,
    isSaving,
    editData,
    userOptions,
    roleOptions,
}: Props) {
    const [form, setForm] = useState<FormState>({
        userId: null,
        roleId: null,
        description: '',
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setForm({
                    userId: editData.userId,
                    roleId: editData.roleId,
                    description: editData.description ?? '',
                });
            } else {
                setForm({ userId: null, roleId: null, description: '' });
            }
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);
        if (form.userId == null || form.roleId == null) return;

        const payload: RoleAssignSavePayload = {
            userId: form.userId,
            roleId: form.roleId,
            description: form.description.trim() || undefined,
        };
        onSave(payload);
    };

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Dialog
            header={editData ? `ແກ້ໄຂ${headerTitle.replace('ເພີ່ມ', '')}` : headerTitle}
            visible={visible}
            style={{ width: '50vw' }}
            breakpoints={{ '960px': '75vw', '641px': '100vw' }}
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-2 pt-2">
                    <Button label="ຍົກເລີກ" icon="pi pi-times" onClick={onHide} className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50" disabled={isSaving} />
                    <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} className="bg-indigo-600 border-indigo-600" loading={isSaving} />
                </div>
            }
            maximizable
            modal
            className="p-fluid"
        >
            <div className="flex flex-column gap-3">
                <div className="field mb-0">
                    <label htmlFor="userId" className="font-bold block mb-2">
                        ຊື່ຄົນ <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="userId"
                        value={form.userId}
                        options={userOptions}
                        onChange={(e) => updateField('userId', e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="ເລືອກຜູ້ໃຊ້"
                        className={submitted && form.userId == null ? 'p-invalid w-full' : 'w-full'}
                        filter
                        showClear
                        disabled={!!editData}
                    />
                    {submitted && form.userId == null && <small className="text-red-500">ກະລຸນາເລືອກຊື່ຄົນ</small>}
                </div>
                <div className="field mb-0">
                    <label htmlFor="roleId" className="font-bold block mb-2">
                        ສະຖານະ <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="roleId"
                        value={form.roleId}
                        options={roleOptions}
                        onChange={(e) => updateField('roleId', e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="ເລືອກສະຖານະ"
                        className={submitted && form.roleId == null ? 'p-invalid w-full' : 'w-full'}
                        filter
                        showClear
                    />
                    {submitted && form.roleId == null && <small className="text-red-500">ກະລຸນາເລືອກສະຖານະ</small>}
                </div>
                <div className="field mb-0">
                    <label htmlFor="description" className="font-bold block mb-2">
                        ຄຳອະທິບາຍ (ວ່າງໄດ້)
                    </label>
                    <InputText
                        id="description"
                        value={form.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>
        </Dialog>
    );
}
