// src/uikit/MenuApps/Detail-category_SupportTeam/HeadCategoryCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { HeadCategoryData, CreateHeadCategoryPayload, UpdateHeadCategoryPayload, DivisionOption } from '../types';

export type HeadCategorySavePayload = CreateHeadCategoryPayload | UpdateHeadCategoryPayload;

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: HeadCategorySavePayload) => void;
    headerTitle: string;
    isSaving: boolean;
    editData?: HeadCategoryData | null;
    divisionOptions: { label: string; value: number }[];
    /** ໃຊ້ດຶງ departmentId ຈາກ divisionId ເວລາສ້າງໃໝ່ */
    divisions?: DivisionOption[];
    /** Role 1: ຄ່າເລີ່ມຕົ້ນຈາກ Profile ເພື່ອບໍ່ໃຫ້ປ້ອນຂ້າມແຜນກ */
    defaultDivisionId?: number;
    defaultDepartmentId?: number;
    /** Role 1 ສ້າງໃໝ່: ລັອກ Dropdown ເລືອກທີມໃຫ້ໃຊ້ແຕ່ແຜນກຂອງຕົນ */
    lockDivisionDropdown?: boolean;
}

interface FormState {
    divisionId: number | null;
    name: string;
    description: string;
}

export default function HeadCategoryCreateDialog({
    visible,
    onHide,
    onSave,
    headerTitle,
    isSaving,
    editData,
    divisionOptions,
    divisions = [],
    defaultDivisionId,
    defaultDepartmentId,
    lockDivisionDropdown = false,
}: Props) {
    const initialFormState: FormState = {
        divisionId: null,
        name: '',
        description: '',
    };

    const [form, setForm] = useState<FormState>(initialFormState);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setForm({
                    divisionId: editData.divisionId ?? editData.division?.id ?? null,
                    name: editData.name ?? '',
                    description: editData.description ?? '',
                });
            } else {
                const divisionId = lockDivisionDropdown && defaultDivisionId != null ? defaultDivisionId : null;
                setForm({
                    divisionId,
                    name: '',
                    description: '',
                });
            }
        }
    }, [visible, editData, lockDivisionDropdown, defaultDivisionId]);

    const handleSave = () => {
        setSubmitted(true);
        if (form.divisionId == null || !form.name.trim()) return;

        if (editData) {
            const payload: UpdateHeadCategoryPayload = {
                name: form.name.trim(),
                description: form.description.trim(),
                departmentId: editData.departmentId ?? editData.department?.id ?? 0,
                divisionId: form.divisionId,
            };
            onSave(payload);
        } else {
            const division = divisions.find((d) => d.id === form.divisionId);
            const departmentId = division?.departmentId ?? defaultDepartmentId ?? 0;
            const divisionId = form.divisionId ?? defaultDivisionId ?? 0;
            const payload: CreateHeadCategoryPayload = {
                departmentId,
                divisionId,
                name: form.name.trim(),
                description: form.description.trim(),
            };
            onSave(payload);
        }
    };

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
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
                <div className="field mb-0">
                    <label htmlFor="divisionId" className="font-bold block mb-2">ເລືອກທີມຊ່ວຍເຫຼືອ <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="divisionId"
                        value={form.divisionId}
                        options={divisionOptions}
                        onChange={(e) => updateField('divisionId', e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="ເລືອກທີມຊ່ວຍເຫຼືອ"
                        className={submitted && form.divisionId == null ? 'p-invalid w-full' : 'w-full'}
                        filter
                        showClear={!lockDivisionDropdown}
                        disabled={lockDivisionDropdown}
                    />
                    {submitted && form.divisionId == null && <small className="text-red-500">ກະລຸນາເລືອກທີມຊ່ວຍເຫຼືອ</small>}
                </div>
                <div className="field mb-0">
                    <label htmlFor="name" className="font-bold block mb-2">ຊື່ທີມສະໜັບສະໜູນ <span className="text-red-500">*</span></label>
                    <InputText
                        id="name"
                        value={form.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className={submitted && !form.name.trim() ? 'p-invalid w-full' : 'w-full'}
                        autoFocus
                    />
                    {submitted && !form.name.trim() && <small className="text-red-500">ກະລຸນາປ້ອນຊື່ທີມສະໜັບສະໜູນ</small>}
                </div>
                <div className="field mb-0">
                    <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
                    <InputTextarea id="description" value={form.description} onChange={(e) => updateField('description', e.target.value ?? '')} className="w-full" rows={3} />
                </div>
            </div>
        </Dialog>
    );
}
