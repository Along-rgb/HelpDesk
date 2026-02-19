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
    activeTab: number;                              // [ເພີ່ມ]
    categoryOptions?: { label: string, value: any }[]; // [ເພີ່ມ]
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
    categoryOptions = []
}: Props) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('ACTIVE');
    const [parentId, setParentId] = useState<number | null>(null); // [ເພີ່ມ] State ສຳລັບເກັບໝວດໝູ່
    const [submitted, setSubmitted] = useState(false);

    const isTopicTab = activeTab === 1; // ກວດສອບວ່າແມ່ນ Tab ລາຍການຫົວຂໍ້ບໍ່

    useEffect(() => {
        if (visible) {
            if (editData) {
                setName(editData.name);
                setDescription(editData.description);
                setStatus(editData.status);
                // [ເພີ່ມ] ດຶງ parentId ຈາກ editData
                setParentId(editData.parentId || null);
            } else {
                setName('');
                setDescription('');
                setStatus('ACTIVE');
                setParentId(null);
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleSave = () => {
        setSubmitted(true);
        if (!name.trim()) return;

        // Validation: ຖ້າເປັນ Tab Topic ຕ້ອງເລືອກໝວດໝູ່
        if (isTopicTab && !parentId) return;

        onSave({ 
            name, 
            description, 
            status,
            parentId: isTopicTab ? (parentId || undefined) : undefined // ສົ່ງ parentId ໄປນຳ
        });
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
                
                {/* [ເພີ່ມ] Dropdown ໝວດໝູ່ ໄວ້ເທິງສຸດ (ສະແດງສະເພາະ Tab ລາຍການຫົວຂໍ້) */}
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

                <div className="field mb-0">
                    <label htmlFor="name" className="font-bold block mb-2">
                        {inputLabel} <span className="text-red-500">*</span>
                    </label>
                    <InputText 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className={submitted && !name.trim() ? 'p-invalid w-full' : 'w-full'}
                        autoFocus={!isTopicTab} // ຖ້າບໍ່ມີ Dropdown ໃຫ້ Focus ທີ່ນີ້
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
            </div>
        </Dialog>
    );
}