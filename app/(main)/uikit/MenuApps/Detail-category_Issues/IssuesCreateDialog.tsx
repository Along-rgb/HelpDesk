import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
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
}

export default function IssueCreateDialog({ 
    visible, 
    onHide, 
    onSave, 
    itemNameLabel, 
    isSaving, 
    editData,
    activeTab,
    categoryOptions
}: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [parentId, setParentId] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const isTopicTab = activeTab === IssueTabs.TOPIC;

    useEffect(() => {
        if (visible) {
            if (editData) {
                setTitle(editData.title);
                setDescription(editData.description);
                setStatus(editData.status);
                // Type safe access
                setParentId(editData.parentId || null);
            } else {
                setTitle('');
                setDescription('');
                setStatus('ACTIVE');
                setParentId(null);
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleHide = () => {
        setTitle('');
        setDescription('');
        setStatus('ACTIVE');
        setParentId(null);
        onHide();
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!title.trim()) return;

        if (isTopicTab && !parentId) {
            return; 
        }

        const payload: CreateIssuePayload = { 
            title, 
            description, 
            status,
            parentId: isTopicTab && parentId ? parentId : undefined
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

    const dialogHeader = editData ? 'ແກ້ໄຂຂໍ້ມູນ' : 'ເພີ່ມຂໍ້ມູນ';

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
                    <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍເພີ່ມເຕີມ</label>
                    <InputText 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        className="w-full" 
                    />
                </div>

                <div className="field">
                    <label className="font-bold block mb-2">ສະຖານະ:</label>
                    <div className="flex gap-4">
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusActive" name="status" value="ACTIVE" onChange={(e) => setStatus(e.value)} checked={status === 'ACTIVE'} />
                            <label htmlFor="statusActive" className="ml-2 cursor-pointer">ໃຊ້ງານ</label>
                        </div>
                        <div className="flex align-items-center">
                            <RadioButton inputId="statusInactive" name="status" value="INACTIVE" onChange={(e) => setStatus(e.value)} checked={status === 'INACTIVE'} />
                            <label htmlFor="statusInactive" className="ml-2 cursor-pointer">ບໍ່ໃຊ້ງານ</label>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}