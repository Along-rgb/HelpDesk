// src/uikit/MenuApps/Detail-category_Issues/IssuesCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { IssueData, CreateIssuePayload } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateIssuePayload) => void;
    itemNameLabel: string;
    isSaving: boolean;
    editData?: IssueData | null;
}

export default function IssueCreateDialog({ visible, onHide, onSave, itemNameLabel, isSaving, editData }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible) {
            if (editData) {
                // Edit Mode
                setTitle(editData.title);
                setDescription(editData.description);
                setStatus(editData.status);
            } else {
                // New Mode
                setTitle('');
                setDescription('');
                setStatus('ACTIVE');
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleHide = () => {
        setTitle('');
        setDescription('');
        setStatus('ACTIVE');
        onHide();
    };

    const handleSave = () => {
        setSubmitted(true);
        if (!title.trim()) return;

        onSave({ title, description, status });
        // ไม่ต้องเรียก handleHide() ที่นี่ เพราะ page.tsx จะเป็นคนสั่งปิดเมื่อ save สำเร็จ
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

    const dialogHeader = editData ? 'ແກ້ໄຂຂໍ້ມູນການແຈ້ງບັນຫາ' : 'ເພີ່ມຂໍ້ມູນການແຈ້ງບັນຫາ';

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