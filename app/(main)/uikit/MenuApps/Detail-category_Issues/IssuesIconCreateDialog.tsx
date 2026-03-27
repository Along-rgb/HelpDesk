// src/uikit/MenuApps/Detail-category_Issues/IssuesIconCreateDialog.tsx
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { IconItemData, CreateIconPayload } from '../types';

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: CreateIconPayload) => void;
    isSaving: boolean;
    editData?: IconItemData | null;
    nextSortOrder: number;
}

export default function IssuesIconCreateDialog({
    visible,
    onHide,
    onSave,
    isSaving,
    editData,
    nextSortOrder,
}: Props) {
    const [iconUrl, setIconUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (visible) {
            if (editData) {
                setIconUrl(editData.iconUrl || '');
                setSelectedFile(null);
            } else {
                setIconUrl('');
                setSelectedFile(null);
            }
            setSubmitted(false);
        }
    }, [visible, editData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => setIconUrl(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        setSubmitted(true);
        const sortOrder = editData?.sortOrder ?? nextSortOrder;
        if (editData && !selectedFile) {
            onSave({ sortOrder });
            return;
        }
        if (!selectedFile) return;
        onSave({
            sortOrder,
            iconFile: selectedFile,
        });
    };

    const needFile = !editData;
    /** โหมดแก้ไข: กดบันทึกได้เสมอ (เก็บลำดับหรือส่งรูปใหม่). โหมดเพิ่ม: ต้องมีไฟล์ก่อน */
    const canSave = editData ? true : !!selectedFile;

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
                disabled={!canSave}
            />
        </div>
    );

    const dialogHeader = editData ? 'ແກ້ໄຂຮູບໄອຄອນ' : 'ເພີ່ມຮູປໄອຄອນ';

    return (
        <Dialog
            header={dialogHeader}
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
                    <label htmlFor="icon-image-issues" className="font-bold block mb-2">
                        ຮູປໄອຄອນ <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`border-dashed border-1 border-round p-4 flex flex-column align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors ${submitted && needFile && !selectedFile ? 'border-red-500' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            id="icon-image-issues"
                            ref={fileInputRef}
                            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {iconUrl ? (
                            <Image src={iconUrl} alt="ໄອຄອນ" width={300} height={240} className="max-w-full border-round" style={{ maxHeight: '15rem', objectFit: 'contain', height: 'auto' }} unoptimized />
                        ) : (
                            <span className="text-500 text-sm">ຄິກທີ່ນີ້ເພື່ອເລືອກຮູບພາບ</span>
                        )}
                    </div>
                    {submitted && needFile && !selectedFile && <small className="text-red-500">ກະລຸນາເລືອກຮູບໄອຄອນ</small>}
                    {editData && (
                        <small className="text-500 block mt-1">ເມື່ອແກ້ໄຂ: ກົດບັນທຶກເພື່ອເກັບລຳດັບ ຫຼື ເລືອກຮູບໃໝ່ເພື່ອປ່ຽນຮູບ.</small>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
