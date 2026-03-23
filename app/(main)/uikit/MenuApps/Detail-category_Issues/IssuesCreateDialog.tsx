import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { IssueData, CategoryData, CreateIssuePayload, CreateCategoryPayload, IssueTabs } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateIssuePayload | CreateCategoryPayload) => void;
    itemNameLabel: string;
    isSaving: boolean;
    editData?: IssueData | CategoryData | null;
    activeTab: number;
    categoryOptions: { label: string; value: number }[];
    /** Tab 0 ໝວດໝູ່: ເລືອກຮູບໄອຄອນ (from /api/categoryicons/selectcategoryicon) */
    iconOptions?: { label: string; value: number; iconUrl?: string }[];
    headerTitle?: string;
    optionalFirstFieldLabel?: string;
    hideIconField?: boolean;
}

export default function IssuesCreateDialog({
    visible,
    onHide,
    onSave,
    itemNameLabel,
    isSaving,
    editData,
    activeTab,
    categoryOptions,
    headerTitle: headerTitleProp,
    optionalFirstFieldLabel,
    iconOptions = [],
    hideIconField = false,
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [optionalFirstValue, setOptionalFirstValue] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [parentId, setParentId] = useState<number | null>(null);
    const [catIconId, setCatIconId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isTopicTab = activeTab === IssueTabs.TOPIC;
    const isCategoryTab = activeTab === IssueTabs.CATEGORY;

    useEffect(() => {
        if (visible) {
            if (editData) {
                setTitle(editData.title);
                setDescription(editData.description ?? '');
                if ('status' in editData) setStatus((editData as IssueData).status ?? 'ACTIVE');
                if ('parentId' in editData) setParentId((editData as IssueData).parentId ?? null);
                if ('catIconId' in editData) setCatIconId((editData as CategoryData).catIconId ?? null);
                setOptionalFirstValue('');
            } else {
                setTitle('');
                setDescription('');
                setStatus('ACTIVE');
                setParentId(null);
                setCatIconId(null);
                setOptionalFirstValue('');
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleHide = () => {
        setTitle('');
        setDescription('');
        setStatus('ACTIVE');
        setParentId(null);
        setCatIconId(null);
        setOptionalFirstValue('');
        onHide();
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!title.trim()) return;

        if (isCategoryTab) {
            const payload: CreateCategoryPayload = {
                headCategoryId: 1,
                title: title.trim(),
                description: description.trim(),
                catIconId: catIconId ?? undefined,
            };
            onSave(payload);
            return;
        }

        if (isTopicTab && !parentId) return;

        const desc =
            optionalFirstFieldLabel && optionalFirstValue.trim()
                ? optionalFirstValue.trim() + '\n' + (description || '')
                : description;

        const payload: CreateIssuePayload = {
            title: title.trim(),
            description: desc,
            status,
            parentId: isTopicTab && parentId ? parentId : undefined,
        };
        onSave(payload);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button 
                label="ຍົກເລີກ" 
                icon="pi pi-times" 
                onClick={handleHide} 
                className="p-button-outlined p-button-secondary text-blue-600 border-blue-600 hover:bg-blue-50" 
                disabled={isSaving}
            />
            <Button 
                label="ບັນທຶກ" 
                icon="pi pi-check" 
                onClick={handleSave} 
                className="bg-indigo-600 border-indigo-600" 
                loading={isSaving}
            />
        </div>
    );

    const dialogHeader = headerTitleProp ? (editData ? 'ແກ້ໄຂ' + headerTitleProp.replace('ເພີ່ມ', '') : headerTitleProp) : (editData ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມຂໍ້ມູນ');

    return (
        <Dialog 
            header={dialogHeader} 
            visible={visible} 
            style={{ width: '50vw' }} 
            breakpoints={{ '960px': '75vw', '641px': '100vw' }} 
            onHide={handleHide} 
            footer={renderFooter()} 
            maximizable 
            modal 
            className="p-fluid"
        >
            <div className="flex flex-column gap-3">
                
                {isCategoryTab && (
                    <>
                        <div className="field mb-0">
                            <label htmlFor="title" className="font-bold block mb-2">
                                {itemNameLabel} <span className="text-red-500">*</span>
                            </label>
                            <InputText 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className={submitted && !title.trim() ? 'p-invalid w-full' : 'w-full'}
                                autoFocus
                            />
                            {submitted && !title.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {itemNameLabel}</small>}
                        </div>
                        {!hideIconField && (
                        <div className="field mb-0">
                            <label htmlFor="catIconId" className="font-bold block mb-2">ເພີ່ມຮູບໄອຄອນ</label>
                            <div className="p-inputgroup">
                                <Dropdown
                                    id="catIconId"
                                    value={catIconId}
                                    options={iconOptions}
                                    onChange={(e) => setCatIconId(e.value)}
                                    placeholder="ເລືອກຮູບໄອຄອນ"
                                    className="flex-1"
                                    optionLabel="label"
                                    optionValue="value"
                                    valueTemplate={(val: number | null) => {
                                        if (val == null) return null;
                                        const opt = iconOptions.find((o) => o.value === val);
                                        return opt?.iconUrl ? (
                                            <span className="flex align-items-center gap-2">
                                                <img src={opt.iconUrl} alt="" className="w-1rem h-1rem object-contain" />
                                                ຮູບໄອຄອນ
                                            </span>
                                        ) : (
                                            <span>ຮູບໄອຄອນ</span>
                                        );
                                    }}
                                    itemTemplate={(opt: { label: string; value: number; iconUrl?: string }) =>
                                        opt.iconUrl ? (
                                            <span className="flex align-items-center gap-2">
                                                <img src={opt.iconUrl} alt="" className="w-2rem h-2rem object-contain" />
                                                ຮູບໄອຄອນ
                                            </span>
                                        ) : (
                                            <span>{opt.label}</span>
                                        )
                                    }
                                    showClear
                                />
                                <Button type="button" icon="pi pi-times" className="p-button-outlined" onClick={() => setCatIconId(null)} tooltip="ລ້າງຄ່າ" />
                            </div>
                        </div>
                        )}
                        <div className="field mb-0">
                            <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
                            <InputText id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full" />
                        </div>
                    </>
                )}

                {!isCategoryTab && optionalFirstFieldLabel && (
                    <div className="field mb-0">
                        <label htmlFor="optionalFirst" className="font-bold block mb-2">{optionalFirstFieldLabel}</label>
                        <InputText
                            id="optionalFirst"
                            value={optionalFirstValue}
                            onChange={(e) => setOptionalFirstValue(e.target.value)}
                            className="w-full"
                            placeholder={optionalFirstFieldLabel}
                        />
                    </div>
                )}

                {isTopicTab && (
                    <div className="field mb-0">
                        <label htmlFor="parentId" className="font-bold block mb-2">
                            ເລືອກໝວດໝູ່ <span className="text-red-500">*</span>
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
                            <label htmlFor="title" className="font-bold block mb-2">
                                {itemNameLabel} <span className="text-red-500">*</span>
                            </label>
                            <InputText 
                                id="title" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className={submitted && !title.trim() ? 'p-invalid w-full' : 'w-full'}
                                autoFocus={!isTopicTab} 
                            />
                            {submitted && !title.trim() && <small className="text-red-500">ກະລຸນາປ້ອນ {itemNameLabel}</small>}
                        </div>

                        <div className="field mb-0">
                            <label htmlFor="description" className="font-bold block mb-2">{optionalFirstFieldLabel ? 'ຄຳອະທິບາຍ (ວ່າງໄດ້)' : 'ຄຳອະທິບາຍເພີ່ມເຕີມ'}</label>
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