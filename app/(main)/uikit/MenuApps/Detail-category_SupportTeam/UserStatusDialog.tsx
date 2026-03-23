// src/uikit/MenuApps/Detail-category_SupportTeam/UserStatusDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import type { RoleData } from '../types';

export interface UserStatusSavePayload {
    name: string;
    description?: string;
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: UserStatusSavePayload, id?: number) => void;
    headerTitle: string;
    isSaving: boolean;
    editData?: RoleData | null;
}

interface FormState {
    name: string;
    description: string;
}

const INITIAL: FormState = { name: '', description: '' };

export default function UserStatusDialog({
    visible,
    onHide,
    onSave,
    headerTitle,
    isSaving,
    editData,
}: Props) {
    const [form, setForm] = useState<FormState>(INITIAL);

    useEffect(() => {
        if (visible) {
            if (editData) {
                setForm({ name: editData.name ?? '', description: editData.description ?? '' });
            } else {
                setForm(INITIAL);
            }
        }
    }, [visible, editData]);

    const isValid = form.name.trim().length > 0;

    const handleSave = () => {
        if (!isValid || isSaving) return;
        const payload: UserStatusSavePayload = {
            name: form.name.trim(),
            ...(form.description.trim() ? { description: form.description.trim() } : {}),
        };
        onSave(payload, editData?.id);
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} loading={isSaving} disabled={!isValid || isSaving} />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerTitle}
            footer={footer}
            modal
            className="p-fluid"
            style={{ width: '450px' }}
            closable={!isSaving}
        >
            <div className="field mb-3">
                <label htmlFor="roleName" className="font-bold mb-2 block">ຊື່ສະຖານະ</label>
                <InputText
                    id="roleName"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="ປ້ອນຊື່ສະຖານະ"
                    autoFocus
                    className={!form.name.trim() ? 'p-invalid' : ''}
                />
            </div>
            <div className="field mb-3">
                <label htmlFor="roleDesc" className="font-bold mb-2 block">ຄຳອະທິບາຍ</label>
                <InputTextarea
                    id="roleDesc"
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="ຄຳອະທິບາຍ (ຖ້າມີ)"
                    rows={3}
                    autoResize
                />
            </div>
        </Dialog>
    );
}
