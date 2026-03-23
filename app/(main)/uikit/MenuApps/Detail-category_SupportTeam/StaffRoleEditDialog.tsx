// src/uikit/MenuApps/Detail-category_SupportTeam/StaffRoleEditDialog.tsx
// ແສງຂໍ້ມູນຈາກຕາຕະລາງທັງໝົດເປັນ disabled, ແກ້ໄຂໄດ້ແຕ່ ສະຖານະ (role)
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import type { AdminAssignUser } from '../types';
import { getRoleDisplayName } from './roleDisplayNames';

export interface StaffRoleSavePayload {
    userId: number;
    roleId: number;
}

/** ດຶງຂໍ້ຄວາມຕຳແໜ່ງຈາກ pos_name — รองรับทั้ง string ແລະ object (ເຊັ່ນ { name }, { pos_name }) */
function getPosNameDisplay(emp: Record<string, unknown>): string {
    const p = emp.pos_name ?? emp.position ?? emp.title;
    if (typeof p === 'string') return p;
    if (p != null && typeof p === 'object') {
        const o = p as Record<string, unknown>;
        const name = o.name ?? o.pos_name ?? o.position_name ?? o.title;
        if (typeof name === 'string') return name;
    }
    return '';
}

/** ດຶງຄ່າເພື່ອແສງໃນ dialog (ຕົງກັບ StaffTable) — ປ້ອງກັນ [object Object] */
function getDisplayValues(u: AdminAssignUser) {
    const emp = (u.employee ?? {}) as Record<string, unknown>;
    const dep = emp.department as { department_name?: string } | undefined;
    const div = emp.division as { division_name?: string } | undefined;
    return {
        emp_code: String(emp.emp_code ?? u.id),
        first_name: String(emp.first_name ?? ''),
        last_name: String(emp.last_name ?? ''),
        division_name: String(emp.division_name ?? div?.division_name ?? ''),
        department_name: String(emp.department_name ?? dep?.department_name ?? ''),
        pos_name: getPosNameDisplay(emp),
        tel: String(emp.tel ?? emp.phone ?? emp.mobile ?? emp.phone_number ?? ''),
        roleName: (getRoleDisplayName(u.roleId) || u.role?.name) ?? '',
    };
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: StaffRoleSavePayload) => void;
    headerTitle: string;
    isSaving: boolean;
    editData: AdminAssignUser | null;
    /** ຕົວເລືອກສະຖານະຈາກ GET /api/roles/selectrole — { label: name, value: id } */
    roleOptions: { label: string; value: number }[];
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <div className="field">
            <label className="font-bold block mb-2 text-500">{label}</label>
            <InputText value={value} className="w-full p-disabled" disabled />
        </div>
    );
}

export default function StaffRoleEditDialog({
    visible,
    onHide,
    onSave,
    headerTitle,
    isSaving,
    editData,
    roleOptions,
}: Props) {
    const [roleId, setRoleId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const displayValues = useMemo(() => (editData ? getDisplayValues(editData) : null), [editData]);

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            if (editData) {
                setRoleId(editData.roleId ?? null);
            } else {
                setRoleId(null);
            }
        }
    }, [visible, editData]);

    const handleSubmit = () => {
        setSubmitted(true);
        if (!editData || roleId == null) return;
        onSave({ userId: editData.id, roleId });
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" className="p-button-outlined" onClick={onHide} disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSubmit} loading={isSaving} disabled={roleId == null} />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerTitle}
            footer={footer}
            className="w-full max-w-md"
            modal
            blockScroll
        >
            <div className="flex flex-column gap-3">
                {displayValues && (
                    <>
                        <ReadOnlyField label="ລະຫັດພະນັກງານ" value={displayValues.emp_code} />
                        <ReadOnlyField label="ຊື່" value={displayValues.first_name} />
                        <ReadOnlyField label="ນາມສະກຸນ" value={displayValues.last_name} />
                        <ReadOnlyField label="ຝ່າຍ" value={displayValues.department_name} />
                        <ReadOnlyField label="ພະແນກ/ສູນ/ສາຂາ" value={displayValues.division_name} />
                        <ReadOnlyField label="ຕຳແໜ່ງ" value={displayValues.pos_name} />
                        <ReadOnlyField label="ເບີໂທຕິດຕໍ່" value={displayValues.tel} />
                    </>
                )}
                <div className="field">
                    <label htmlFor="staff-role-id" className="font-bold block mb-2">
                        ສະຖານະ <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="staff-role-id"
                        value={roleId}
                        options={roleOptions}
                        onChange={(e) => setRoleId(e.value)}
                        optionLabel="label"
                        optionValue="value"
                        placeholder="ເລືອກສະຖານະ"
                        className={submitted && roleId == null ? 'p-invalid w-full' : 'w-full'}
                        filter
                        showClear
                    />
                    {submitted && roleId == null && <small className="text-red-500">ກະລຸນາເລືອກສະຖານະ</small>}
                </div>
            </div>
        </Dialog>
    );
}
