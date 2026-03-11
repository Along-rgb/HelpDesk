// src/uikit/MenuApps/Detail-category-SupportTeam/StaffEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import type { AdminAssignUser } from '../types';

export interface StaffEditSavePayload {
    userId: number;
    roleId: number;
}

function getEmpCode(row: AdminAssignUser): string {
    return row.employee?.emp_code ?? row.username ?? '-';
}
function getFullName(row: AdminAssignUser): string {
    const first = row.employee?.first_name ?? '';
    const last = row.employee?.last_name ?? '';
    return `${first} ${last}`.trim() || '-';
}
function getDepartmentName(row: AdminAssignUser): string {
    return row.employee?.department?.department_name ?? '-';
}
function getDivisionName(row: AdminAssignUser): string {
    return row.employee?.division?.division_name ?? '-';
}
function getPosName(row: AdminAssignUser): string {
    return row.employee?.position?.pos_name ?? '-';
}
function getUnitName(row: AdminAssignUser): string {
    return row.employee?.unit?.unit_name ?? '-';
}
function getTel(row: AdminAssignUser): string {
    return row.employee?.tel ?? '-';
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (payload: StaffEditSavePayload) => void;
    staffData: AdminAssignUser | null;
    roleOptions: { label: string; value: number }[];
    isSaving: boolean;
}

export default function StaffEditDialog({
    visible,
    onHide,
    onSave,
    staffData,
    roleOptions,
    isSaving,
}: Props) {
    const [roleId, setRoleId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible && staffData) {
            setRoleId(staffData.roleId ?? staffData.role?.id ?? null);
            setSubmitted(false);
        }
    }, [visible, staffData]);

    const handleSave = () => {
        setSubmitted(true);
        if (!staffData || roleId == null) return;
        onSave({ userId: staffData.id, roleId });
    };

    const canSave = staffData && roleId != null;
    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="ຍົກເລີກ" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={isSaving} />
            <Button label="ບັນທຶກ" icon="pi pi-check" onClick={handleSave} loading={isSaving} disabled={!canSave} />
        </div>
    );

    if (!staffData) return null;

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header="ແກ້ໄຂຂໍ້ມູນພະນັກງານ"
            footer={footer}
            className="w-full max-w-2xl"
            dismissableMask
            blockScroll
        >
            <div className="flex flex-column gap-3">
                <div className="grid p-fluid">
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ລະຫັດ ພ/ງ</label>
                        <InputText value={getEmpCode(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ຊື່ ແລະ ນາມສະກຸນ</label>
                        <InputText value={getFullName(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ຝ່າຍ</label>
                        <InputText value={getDepartmentName(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ພະແນກ/ສູນ/ສາຂາ</label>
                        <InputText value={getDivisionName(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ຕຳແໜ່ງ</label>
                        <InputText value={getPosName(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ໜ່ວຍງານ</label>
                        <InputText value={getUnitName(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ເບີໂທຕິດຕໍ່</label>
                        <InputText value={getTel(staffData)} disabled className="w-full" />
                    </div>
                    <div className="col-12 md:col-6">
                        <label className="block text-sm font-medium mb-1">ສະຖານະ <span className="text-red-500">*</span></label>
                        <Dropdown
                            value={roleId}
                            options={roleOptions}
                            onChange={(e) => setRoleId(e.value)}
                            placeholder="ເລືອກສະຖານະ"
                            className="w-full"
                            disabled={isSaving}
                        />
                        {submitted && roleId == null && <small className="text-red-500">ກະລຸນາເລືອກສະຖານະ</small>}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
