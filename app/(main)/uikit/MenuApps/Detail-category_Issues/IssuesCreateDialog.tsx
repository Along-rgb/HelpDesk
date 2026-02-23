import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { IssueData, CreateIssuePayload, IssueTabs } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateIssuePayload) => void;
    itemNameLabel: string;
    isSaving: boolean;
    editData?: IssueData | null;
    activeTab: number;                         
    categoryOptions: { label: string, value: any }[];
    /** ໃຊ້ໃນໜ້າ SupportTeam tab 0: ເປີດໃຊ້ header ແລະ ຟິວ ທີມສະໜັບສະໜູນ */
    headerTitle?: string;
    /** ເມື່ອມີ ສະແດງຟິວເລືອກຕົ້ນ (ວ່າງໄດ້) */
    optionalFirstFieldLabel?: string;
    /** Tab 0 ໝວດໝູ່: ເລືອກທີມສະໜັບສະໜູນ */
    supportTeamOptions?: { label: string; value: number }[];
    /** Tab 0 ໝວດໝູ່: ເພີ່ມຮູບໄອຄອນ (ເລືອກຈາກລາຍການໄອຄອນ) */
    iconOptions?: { label: string; value: number; iconUrl?: string }[];
    /** ໃຊ້ໃນໜ້າ SupportTeam: ບໍ່ສະແດງຟິວ ເພີ່ມຮູບໄອຄອນ */
    hideIconField?: boolean;
}

export default function IssueCreateDialog({ 
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
    supportTeamOptions = [],
    iconOptions = [],
    hideIconField = false
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [optionalFirstValue, setOptionalFirstValue] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [parentId, setParentId] = useState<number | null>(null);
    const [supportTeamId, setSupportTeamId] = useState<number | null>(null);
    const [iconId, setIconId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isTopicTab = activeTab === IssueTabs.TOPIC;
    const isCategoryTab = activeTab === IssueTabs.CATEGORY;

    useEffect(() => {
        if (visible) {
            if (editData) {
                setTitle(editData.title);
                setDescription(editData.description);
                setStatus(editData.status);
                setParentId(editData.parentId || null);
                setSupportTeamId(editData.supportTeamId ?? null);
                setIconId(editData.iconId ?? null);
                setOptionalFirstValue('');
            } else {
                setTitle('');
                setDescription('');
                setStatus('ACTIVE');
                setParentId(null);
                setSupportTeamId(null);
                setIconId(null);
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
        setSupportTeamId(null);
        setIconId(null);
        setOptionalFirstValue('');
        onHide();
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!title.trim()) return;

        if (isTopicTab && !parentId) {
            return; 
        }

        const desc = optionalFirstFieldLabel && optionalFirstValue.trim()
            ? optionalFirstValue.trim() + '\n' + (description || '')
            : description;

        const payload: CreateIssuePayload = { 
            title, 
            description: desc, 
            status,
            parentId: isTopicTab && parentId ? parentId : undefined,
            supportTeamId: isCategoryTab ? (supportTeamId ?? undefined) : undefined,
            iconId: isCategoryTab && !hideIconField ? (iconId ?? undefined) : undefined
        };

        onSave(payload);
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button 
                tabIndex={0}
                label="ຍົກເລີກ" 
                icon="pi pi-times" 
                onClick={handleHide} 
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