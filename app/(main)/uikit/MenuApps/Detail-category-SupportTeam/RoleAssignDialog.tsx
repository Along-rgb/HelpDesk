// src/uikit/MenuApps/Detail-category-SupportTeam/RoleAssignDialog.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import axiosClientsHelpDesk from '@/config/axiosClientsHelpDesk';
import type { UserRoleData, CreateUserRolePayload, UpdateUserRolePayload, AdminAssignUser } from '../types';

export type RoleAssignSavePayload = CreateUserRolePayload | UpdateUserRolePayload;

/** Response from GET /api/users/{id} (API.md) — ໃຊ້ເມື່ອ Role 1 ຄົ້ນຫາດ້ວຍລະຫັດ (id ລຳດັບລະບົບ). */
interface UserByIdResponse {
    id: number;
    employee?: {
        first_name?: string;
        last_name?: string;
        department?: { department_name?: string };
        division?: { division_name?: string };
    };
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: RoleAssignSavePayload) => void;
    headerTitle: string;
    isSaving: boolean;
    editData?: UserRoleData | null;
    userOptions: { label: string; value: number }[];
    roleOptions: { label: string; value: number }[];
    /** ລາຍຊື່ຜູ້ໃຊ້ເຕັມ (จาก /api/users ຫຼື /api/users/admin) ເພື່ອໃຊ້ແສງ Confirmation Section ເມື່ອເລືອກຈາກ Dropdown */
    userList?: AdminAssignUser[];
    /** true = ໃຫ້ເປີດການຄົ້ນຫາດ້ວຍລະຫັດ (GET /api/users/{id}) — ສຳລັບ Role 1 ເທົ່ານັ້ນ */
    allowSearchById?: boolean;
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
    userList = [],
    allowSearchById = false,
}: Props) {
    const [form, setForm] = useState<FormState>({
        userId: null,
        roleId: null,
        description: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [employeeIdInput, setEmployeeIdInput] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchedUser, setSearchedUser] = useState<UserByIdResponse | null>(null);

    const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    /** ຜູ້ໃຊ້ທີ່ເລືອກຈາກ Dropdown (ຈາກ userList) ເພື່ອໃຊ້ແສງ Confirmation Section */
    const selectedUserFromList = useMemo(
        () => (form.userId != null ? userList.find((u) => u.id === form.userId) : undefined),
        [userList, form.userId]
    );

    useEffect(() => {
        if (visible) {
            setSubmitted(false);
            setSearchError(null);
            setSearchedUser(null);
            setEmployeeIdInput('');
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

    const handleSearchById = useCallback(async () => {
        const id = employeeIdInput.trim();
        if (!id) {
            setSearchError('ກະລຸນາໃສ່ລະຫັດພະນັກງານ');
            return;
        }
        const numId = Number(id);
        if (!Number.isInteger(numId) || numId < 1) {
            setSearchError('ລະຫັດພະນັກງານຕ້ອງເປັນຕົວເລກທີ່ຖືກຕ້ອງ');
            return;
        }
        setSearchLoading(true);
        setSearchError(null);
        setSearchedUser(null);
        try {
            const { data } = await axiosClientsHelpDesk.get<UserByIdResponse>(`users/${numId}`);
            setSearchedUser(data);
            updateField('userId', data.id);
        } catch (err: unknown) {
            const status = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response?.status
                : undefined;
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            if (status === 404 || status === 403) {
                setSearchError('ບໍ່ພົບຂໍ້ມູນພະນັກງານຕາມລະຫັດທີ່ໃສ່');
            } else {
                setSearchError(typeof msg === 'string' ? msg : 'ເກີດຂໍ້ຜິດພາດໃນການຄົ້ນຫາ');
            }
        } finally {
            setSearchLoading(false);
        }
    }, [employeeIdInput, updateField]);

    const handleClearSearch = useCallback(() => {
        setSearchedUser(null);
        setEmployeeIdInput('');
        setSearchError(null);
        updateField('userId', null);
    }, [updateField]);

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
                {!editData && (
                    <>
                        {allowSearchById && (
                            <div className="field mb-0">
                                <label htmlFor="employeeIdSearch" className="font-bold block mb-2">
                                    ລະຫັດພະນັກງານ (id ລຳດັບລະບົບ)
                                </label>
                                <div className="flex gap-2 align-items-center flex-wrap">
                                    <InputText
                                        id="employeeIdSearch"
                                        value={employeeIdInput}
                                        onChange={(e) => {
                                            setEmployeeIdInput(e.target.value);
                                            setSearchError(null);
                                        }}
                                        placeholder="ໃສ່ລະຫັດແລ້ວກົດຄົ້ນຫາ"
                                        className="flex-1 min-w-12rem"
                                        disabled={searchLoading}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
                                    />
                                    <Button
                                        label="ຄົ້ນຫາ"
                                        icon="pi pi-search"
                                        onClick={handleSearchById}
                                        loading={searchLoading}
                                        disabled={searchLoading}
                                        className="p-button-outlined"
                                    />
                                </div>
                                {searchError && <small className="text-red-500 block mt-1">{searchError}</small>}
                            </div>
                        )}

                        <div className="field mb-0">
                            <label htmlFor="userId" className="font-bold block mb-2">
                                ຊື່ຄົນ / ລະຫັດພະນັກງານ <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="userId"
                                value={form.userId}
                                options={userOptions}
                                onChange={(e) => {
                                    updateField('userId', e.value ?? null);
                                    setSearchedUser(null);
                                    setEmployeeIdInput('');
                                    setSearchError(null);
                                }}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="ພິມຄົ້ນຫາດ້ວຍລະຫັດພະນັກງານ ຫຼື ຊື່ ແລ້ວເລືອກ"
                                className={submitted && form.userId == null ? 'p-invalid w-full' : 'w-full'}
                                filter
                                filterPlaceholder="ຄົ້ນຫາ..."
                                showClear
                                disabled={!!editData}
                            />
                            {submitted && form.userId == null && (
                                <small className="text-red-500 block mt-1">ກະລຸນາເລືອກພະນັກງານ ຫຼື ຄົ້ນຫາດ້ວຍລະຫັດພະນັກງານ</small>
                            )}
                        </div>

                        {(searchedUser || selectedUserFromList) && (
                            <div className="surface-100 border-round p-3 flex flex-column gap-2">
                                {searchedUser && (
                                    <div className="flex align-items-center justify-content-end mb-1">
                                        <Button label="ປ່ຽນ" icon="pi pi-refresh" text size="small" onClick={handleClearSearch} className="p-button-secondary" />
                                    </div>
                                )}
                                <div className="font-semibold text-900 mb-2">ຂໍ້ມູນພະນັກງານ (ຢືນຢັນກ່ອນບັນທຶກ)</div>
                                <div className="grid">
                                    <div className="col-12 md:col-4">
                                        <span className="text-500 text-sm block">ຊື່ພະນັກງານ</span>
                                        <span className="font-medium">
                                            {searchedUser
                                                ? `${searchedUser.employee?.first_name ?? ''} ${searchedUser.employee?.last_name ?? ''}`.trim() || '-'
                                                : `${selectedUserFromList?.employee?.first_name ?? ''} ${selectedUserFromList?.employee?.last_name ?? ''}`.trim() || '-'}
                                        </span>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <span className="text-500 text-sm block">ຝ່າຍ</span>
                                        <span className="font-medium">
                                            {searchedUser?.employee?.department?.department_name ??
                                                selectedUserFromList?.employee?.department?.department_name ??
                                                '-'}
                                        </span>
                                    </div>
                                    <div className="col-12 md:col-4">
                                        <span className="text-500 text-sm block">ພະແນກ</span>
                                        <span className="font-medium">
                                            {searchedUser?.employee?.division?.division_name ??
                                                selectedUserFromList?.employee?.division?.division_name ??
                                                '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {editData && (
                    <div className="field mb-0">
                        <label className="font-bold block mb-2 text-500">ຜູ້ໃຊ້ທີ່ເລືອກ</label>
                        <span className="font-medium text-900">{editData.userName ?? `ID: ${editData.userId}`}</span>
                    </div>
                )}

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
