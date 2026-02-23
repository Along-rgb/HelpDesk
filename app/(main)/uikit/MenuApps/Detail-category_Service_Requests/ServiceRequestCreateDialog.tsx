// src/uikit/MenuApps/Detail-category_Service_Requests/ServiceRequestCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown'; // [ເພີ່ມ]
import { ServiceRequestData, CreateServiceRequestPayload } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateServiceRequestPayload) => void;
    headerTitle: string;
    inputLabel: string;
    isSaving: boolean;
    editData?: ServiceRequestData | null;
    activeTab: number;                              
    categoryOptions?: { label: string, value: any }[];
    supportTeamOptions?: { label: string; value: number }[];
    iconOptions?: { label: string; value: number; iconUrl?: string }[];
}

export default function ServiceRequestCreateDialog({ 
    visible, 
    onHide, 
    onSave, 
    headerTitle, 
    inputLabel, 
    isSaving, 
    editData,
    activeTab,
    categoryOptions = [],
    supportTeamOptions = [],
    iconOptions = []
}: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [parentId, setParentId] = useState<number | null>(null);
    const [supportTeamId, setSupportTeamId] = useState<number | null>(null);
    const [iconId, setIconId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isCategoryTab = activeTab === 0;
    const isTopicTab = activeTab === 1;

    useEffect(() => {
        if (visible) {
            if (editData) {
                setName(editData.name);
                setDescription(editData.description);
                setStatus(editData.status);
                setParentId(editData.parentId || null);
                setSupportTeamId(editData.supportTeamId ?? null);
                setIconId(editData.iconId ?? null);
            } else {
                setName('');
                setDescription('');
                setStatus('ACTIVE');
                setParentId(null);
                setSupportTeamId(null);
                setIconId(null);
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);
        if (!name.trim()) return;

        if (isTopicTab && !parentId) return;

        onSave({ 
            name, 
            description, 
            status,
            parentId: isTopicTab ? (parentId || undefined) : undefined,
            supportTeamId: isCategoryTab ? (supportTeamId ?? undefined) : undefined,
            iconId: isCategoryTab ? (iconId ?? undefined) : undefined
        });
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button 
                tabIndex={0}
                label="ຍົກເລີກ" 
                icon="pi pi-times" 
                onClick={onHide} 
                className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50"
                disabled={isSaving}
            />
            <Button 
                tabIndex={0}
                label="ບັນທຶກ" 
                icon="pi pi-check" 
                onClick={handleSave} 
                className="bg-indigo-600 border-indigo-600"
                loading={isSaving}
            />
        </div>
    );

    const finalHeader = editData ? `ແກ້ໄຂ${headerTitle.replace('ເພີ່ມ', '')}` : headerTitle;

    return (
        <Dialog 
            header={finalHeader} 
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
                
                {isCategoryTab && (
                    <div className="field mb-0">
                        <label htmlFor="supportTeamId" className="font-bold block mb-2">ເລືອກທີມຊ່ວຍເຫຼືອ</label>
                        <div className="p-inputgroup">
                            <Dropdown
                                id="supportTeamId"
                                value={supportTeamId}
                                options={supportTeamOptions}
                                onChange={(e) => setSupportTeamId(e.value)}
                                placeholder="ເລືອກທີມຊ່ວຍເຫຼືອ"
                                className="flex-1"
                                filter
                                showClear
                            />
                            <Button tabIndex={0} type="button" icon="pi pi-times" className="p-button-outlined" onClick={() => setSupportTeamId(null)} tooltip="ລ້າງຄ່າ" />
                        </div>
                    </div>
                )}

                {isCategoryTab && (
                    <>
                        <div className="field mb-0">
                            <label htmlFor="name" className="font-bold block mb-2">
                                {inputLabel} <span className="text-red-500">*</span>
                            </label>
                            <InputText 
                                id="name" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className={submitted && !name.trim() ? 'p-invalid w-full' : 'w-full'}
                                autoFocus
                            />
                            {submitted && !name.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {inputLabel}</small>}
                        </div>
                        <div className="field mb-0">
                            <label htmlFor="iconId" className="font-bold block mb-2">ເພີ່ມຮູບໄອຄອນ</label>
                            <div className="p-inputgroup">
                                <Dropdown
                                    id="iconId"
                                    value={iconId}
                                    options={iconOptions}
                                    onChange={(e) => setIconId(e.value)}
                                    placeholder="ເລືອກຮູບໄອຄອນ"
                                    className="flex-1"
                                    optionLabel="label"
                                    optionValue="value"
                                    valueTemplate={(val: number | null) => {
                                        if (val == null) return null;
                                        const opt = iconOptions.find(o => o.value === val);
                                        return opt?.iconUrl ? (
                                            <span className="flex align-items-center gap-2">
                                                <img src={opt.iconUrl} alt="" className="w-1rem h-1rem object-contain" />
                                                ຮູບໄອຄອນ
                                            </span>
                                        ) : <span>ຮູບໄອຄອນ</span>;
                                    }}
                                    itemTemplate={(opt: { label: string; value: number; iconUrl?: string }) => opt.iconUrl ? (
                                        <span className="flex align-items-center gap-2">
                                            <img src={opt.iconUrl} alt="" className="w-2rem h-2rem object-contain" />
                                            ຮູບໄອຄອນ
                                        </span>
                                    ) : <span>{opt.label}</span>}
                                    showClear
                                />
                                <Button tabIndex={0} type="button" icon="pi pi-times" className="p-button-outlined" onClick={() => setIconId(null)} tooltip="ລ້າງຄ່າ" />
                            </div>
                        </div>
                        <div className="field mb-0">
                            <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
                            <InputText id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
                        </div>
                    </>
                )}

                {/* Tab ລາຍການຫົວຂໍ້ */}
                {isTopicTab && (
                    <div className="field mb-0">
                        <label htmlFor="parentId" className="font-bold block mb-2">
                            ໝວດໝູ່ <span className="text-red-500">*</span>
                        </label>
                        <Dropdown 
                            id="parentId"
                            value={parentId} 
                            options={categoryOptions} 
                            onChange={(e) => setParentId(e.value)} 
                            placeholder="ເລືອກໝວດໝູ່"
                            className={submitted && !parentId ? 'p-invalid w-full' : 'w-full'}
                            filter
                            autoFocus
                        />
                        {submitted && !parentId && <small className="text-red-500">ກະລຸນາເລືອກໝວດໝູ່</small>}
                    </div>
                )}

                {!isCategoryTab && (
                    <>
                <div className="field mb-0">
                    <label htmlFor="name" className="font-bold block mb-2">
                        {inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <InputText 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className={submitted && !name.trim() ? 'p-invalid w-full' : 'w-full'}
                        autoFocus={!isTopicTab}
                    />
                    {submitted && !name.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {inputLabel}</small>}
                </div>

                <div className="field mb-0">
                    <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
                    <InputText 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        className="w-full"
                    />
                </div>
                    </>
                )}
            </div>
        </Dialog>
    );
}