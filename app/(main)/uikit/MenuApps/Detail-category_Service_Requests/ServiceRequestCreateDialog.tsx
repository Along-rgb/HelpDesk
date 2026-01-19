// src/uikit/MenuApps/Detail-category_Service_Requests/ServiceRequestCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { ServiceRequestData, CreateServiceRequestPayload } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateServiceRequestPayload) => void;
    headerTitle: string;
    inputLabel: string;
    isSaving: boolean;
    editData?: ServiceRequestData | null;
}

export default function ServiceRequestCreateDialog({ visible, onHide, onSave, headerTitle, inputLabel, isSaving, editData }: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (visible) {
            if (editData) {
                setName(editData.name);
                setDescription(editData.description);
                setStatus(editData.status);
            } else {
                setName('');
                setDescription('');
                setStatus('ACTIVE');
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);
        if (!name.trim()) return;

        onSave({ name, description, status });
    };

    const renderFooter = () => (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button 
                label="ຍົກເລີກ" 
                icon="pi pi-times" 
                onClick={onHide} 
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
                    <label htmlFor="description" className="font-bold block mb-2">ຄຳອະທິບາຍ (ວ່າງໄດ້)</label>
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