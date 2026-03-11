// src/uikit/MenuApps/Detail-category-SupportTeam/SupportTeamCreateDialog.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SupportTeamData, CreateSupportTeamPayload, SupportTeamTabs } from '../types';
import type { HeadCategorySelectItem, AdminAssignUser } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateSupportTeamPayload) => void;
    headerTitle: string;
    inputLabel: string;
    isSaving: boolean;
    editData?: SupportTeamData | null;
    activeTab: number;
    /** Tab ວິຊາການ: ตัวเลือก "ເລືອກທີມຊ່ວຍເຫຼືອ" จาก headCategorySelectItems เท่านั้น (GET /api/headcategorys/selectheadcategory). Role 2 ได้รับรายการที่กรอง divisionId ตรงกับ user แล้ว */
    headCategoryTeamOptions?: { label: string; value: number }[];
    /** ข้อมูล head category จาก selectheadcategory สำหรับดึง divisionId กรองວິຊາການ */
    headCategorySelectItems?: HeadCategorySelectItem[];
    /** รายชื่อจาก users/admin สำหรับຊື່ວິຊາການ (first_name + last_name), กรองตาม divisionId */
    adminUsers?: AdminAssignUser[];
    /** fallback: ตัวเลือกທີມ (tab อื่น) */
    issueOptions?: { label: string; value: unknown }[];
    userOptions?: { label: string; value: unknown }[];
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
    headCategoryTeamOptions = [],
    headCategorySelectItems = [],
    adminUsers = [],
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
        const isTechnicalTab = activeTab === SupportTeamTabs.TECHNICAL;
        if (isTechnicalTab) {
            if (!form.issueCategoryId) return;
            if (!form.assignedAdminIds?.length) return;
        } else {
            if (!form.name.trim()) return;
        }

        const nameLabel = isTechnicalTab && form.assignedAdminIds?.length
            ? form.assignedAdminIds.map(id => technicalUserOptions.find(o => o.value === id)?.label ?? userOptions.find((o: { value: unknown }) => o.value === id)?.label ?? String(id)).join(', ')
            : form.name;
        const payload: CreateSupportTeamPayload = {
            ...form,
            name: nameLabel,
            issueCategoryId: form.issueCategoryId || undefined,
            assignedAdminIds: form.assignedAdminIds
        };

        onSave(payload);
    };

    const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (key === 'issueCategoryId') setForm(prev => ({ ...prev, assignedAdminIds: [] }));
    };

    const isTechnicalTab = activeTab === SupportTeamTabs.TECHNICAL;
    /** Tab ວິຊາການ: ใช้เฉพาะ headCategoryTeamOptions (จาก selectheadcategory; Role 2 เห็นเฉพาะ division เดียวกัน) */
    const teamOptionsForTechnical = headCategoryTeamOptions.length > 0 ? headCategoryTeamOptions : issueOptions.map(o => ({ label: o.label, value: o.value as number }));

    /** Tab ວິຊາການ: ໃຊ້ departmentId เปรียบเทียบ head category ກັບ users จาก /api/users/admin */
    const technicalUserOptions = useMemo(() => {
        if (!isTechnicalTab || !form.issueCategoryId || !Array.isArray(adminUsers) || adminUsers.length === 0) return [];
        const head = headCategorySelectItems.find((h) => h.id === form.issueCategoryId);
        const departmentId = head?.departmentId;
        if (departmentId == null) return [];
        return adminUsers
            .filter((u) => (u.employee?.departmentId ?? u.employee?.department?.id) === departmentId)
            .map((u) => {
                const first = u.employee?.first_name ?? '';
                const last = u.employee?.last_name ?? '';
                return { label: `${first} ${last}`.trim() || u.username || String(u.id), value: u.id };
            });
    }, [isTechnicalTab, form.issueCategoryId, headCategorySelectItems, adminUsers]);

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
                
                {activeTab === SupportTeamTabs.TECHNICAL && (
                    <>
                        <div className="field mb-0">
                            <label htmlFor="supportTeamId" className="font-bold block mb-2">ເລືອກທີມຊ່ວຍເຫຼືອ <span className="text-red-500">*</span></label>
                            <Dropdown
                                id="supportTeamId"
                                value={form.issueCategoryId}
                                options={teamOptionsForTechnical}
                                onChange={(e) => updateField('issueCategoryId', e.value)}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="ເລືອກທີມຊ່ວຍເຫຼືອ"
                                className={(submitted && form.issueCategoryId == null) ? 'p-invalid w-full' : 'w-full'}
                                filter
                                showClear
                            />
                            {submitted && form.issueCategoryId == null && <small className="text-red-500">ກະລຸນາເລືອກທີມຊ່ວຍເຫຼືອ</small>}
                        </div>
                        <div className="field mb-0">
                            <label htmlFor="assignedAdminIds" className="font-bold block mb-2">
                                {inputLabel} <span className="text-red-500">*</span>
                            </label>
                            <MultiSelect
                                id="assignedAdminIds"
                                value={form.assignedAdminIds}
                                options={technicalUserOptions}
                                onChange={(e) => updateField('assignedAdminIds', e.value ?? [])}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="ເລືອກວິຊາການ"
                                className={(submitted && !form.assignedAdminIds?.length) ? 'p-invalid w-full' : 'w-full'}
                                filter
                                display="chip"
                                disabled={!form.issueCategoryId}
                            />
                            {!form.issueCategoryId && <small className="text-gray-500 block mt-1">ກະລຸນາເລືອກທີມຊ່ວຍເຫຼືອກ່ອນ</small>}
                            {submitted && !form.assignedAdminIds?.length && <small className="text-red-500">ກະລຸນາເລືອກວິຊາການຢ່າງໜ້ອຍ 1 ລາຍການ</small>}
                        </div>
                    </>
                )}

                {activeTab !== SupportTeamTabs.TECHNICAL && (
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