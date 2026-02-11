// invalidstate/page.tsx
"use client";
import React, { useMemo } from "react";
import { Editor } from "primereact/editor";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useTicketForm } from './useTicketForm';
import { FormDropdown } from '../../../components/FormDropdown';

const RequestForm = () => {
    const {
        form, masterData, availableTopics, isSubmitting, isCategoryLocked,
        updateField, handleCategoryChange, handleBuildingChange, handleLevelChange,
        handleFileSelect, handleRemoveFile, handleImageSelect, handleRemoveImage,
        handleSubmit, handleReset, handleCancel, fileInputRef, imageInputRef
    } = useTicketForm();

    const editorHeader = useMemo(() => (
        <span className="ql-formats">
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
        </span>
    ), []);

    const grayFieldStyle = { backgroundColor: '#f4f4f4', fontWeight: '500' };

    return (
        <div className="relative pb-8">
            <div className="card text-base p-0 relative mb-4">
                <div className="flex align-items-center justify-content-center p-3 bg-bluegray-50 border-bottom-1 border-yellow-200">
                    <i className="pi pi-id-card text-yellow-600 mr-2 text-xl"></i>
                    <div className="flex flex-wrap gap-2 text-800 font-bold">
                        <span>ພາກສ່ວນຮ້ອງຂໍ:</span>
                        <span>ຝ່າຍພັດທະນາ-ຄຸ້ມຄອງ-ບຳລຸງຮັກສາ | ພະແນກສູນຂໍ້ມູນ | ທ. ດາລິສັກ ສິມສະໝຸດ</span>
                    </div>
                </div>

                <div className="p-fluid p-4">
                    {/* ... (ส่วน Category, Asset Number, Topic, Location คงเดิม) ... */}
                    <div className="formgrid grid mb-3">
                        <div className="field col-12 md:col-6">
                            <label htmlFor="category" className="font-bold block mb-2">ໝວດໝູ່</label>
                            <InputText id="category" value={form.category?.name || ''} onChange={(e) => handleCategoryChange({ name: e.target.value })} disabled={isCategoryLocked} className="w-full" style={grayFieldStyle} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label htmlFor="assetNumber" className="font-bold block mb-2">ເລກ ຊຄທ</label>
                            <InputText id="assetNumber" value={form.assetNumber} onChange={(e) => updateField('assetNumber', e.target.value)} className="w-full" style={grayFieldStyle} placeholder="ກະລຸນາເພີ່ມເລກ ຊຄທ" />
                        </div>
                    </div>

                    <div className="field mb-3">
                        <FormDropdown label="ຫົວຂໍ້*" value={form.topic} options={availableTopics} onChange={(e) => updateField('topic', e.value)} disabled={!form.category} placeholder={form.category ? "ເລືອກຫົວຂໍ້ບັນຫາ" : "ກະລຸນາເລືອກໝວດໝູ່ກ່ອນ"} />
                    </div>

                    <div className="formgrid grid mb-3">
                        <FormDropdown className="field col-12 md:col-4" label="ຕຶກ/ອາຄານ*" value={form.building} options={masterData?.buildings || []} onChange={(e) => handleBuildingChange(e.value)} />
                        <FormDropdown className="field col-12 md:col-4" label="ລະດັບຊັ້ນ*" value={form.level} options={masterData?.levels || []} onChange={(e) => handleLevelChange(e.value)} disabled={!form.building} />
                        <FormDropdown className="field col-12 md:col-4" label="ໝາຍເລກຫ້ອງ (ວ່າງໄດ້)" value={form.roomNumber} options={masterData?.rooms || []} onChange={(e) => updateField('roomNumber', e.value)} disabled={!form.level} showClear />
                    </div>

                    <div className="field mb-4">
                        <label className="font-bold mb-2 block">ລາຍລະອຽດເພີ່ມເຕີມ</label>
                        <Editor value={form.description} onTextChange={(e) => updateField('description', e.htmlValue)} headerTemplate={editorHeader} style={{ height: '150px' }} />
                    </div>

                    {/* 5. Attach File (PDF, DOCX, XLSX) */}
                    <div className="field mb-4">
                        <label className="font-bold block mb-2"> <i className="pi pi-paperclip mr-2"></i> ແນບໄຟລ໌ </label>
                        <div className={`border-dashed border-1 border-300 border-round p-4 flex flex-column align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors
                             ${form.attachments.length >= 2 ? 'opacity-70' : ''}`} onClick={() => {
                                if (form.attachments.length < 2)
                                    fileInputRef.current?.click()
                            }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                                accept=".pdf, .docx, .xlsx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            />
                            {form.attachments.length === 0 && <span className="text-500 text-sm">ຄິກທີ່ນີ້ເພື່ອແນບໄຟລ໌</span>}
                            {form.attachments.length > 0 && (
                                <div className="w-full flex flex-column align-items-center gap-2">
                                    {form.attachments.map((file, index) => (
                                        <div key={index} className="flex align-items-center justify-content-between w-full md:w-8 surface-100 border-round px-3 py-2 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-900 font-medium text-sm">{file.name}</span>
                                            <Button icon="pi pi-times" rounded text severity="danger" onClick={(e) => { e.stopPropagation(); handleRemoveFile(index); }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 6. Attach Images (PNG, JPEG, GIF) */}
                    <div className="field mb-5">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <label className="font-bold block m-0">
                                <i className="pi pi-images mr-2"></i> ແນບຮູບ 
                            </label>
                            <span className="text-sm font-medium text-600">
                                ຈຳນວນຮູບ ({form.images.length}/6)
                            </span>
                        </div>

                        <div
                            className={`border-dashed border-1 border-round p-4 flex flex-column align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors ${form.images.length >= 6 ? 'opacity-70' : ''}`}
                            onClick={() => { if (form.images.length < 6) imageInputRef.current?.click() }}
                        >
                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                                multiple
                                onChange={handleImageSelect}
                            />
                            {form.images.length === 0 && <span className="text-500 text-sm">ຄິກທີ່ນີ້ເພື່ອແນບຮູບພາບ</span>}
                            {form.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-content-center w-full">
                                    {form.images.map((img, index) => (
                                        <div key={index} className="flex align-items-center bg-gray-100 border-round px-3 py-2 shadow-1" onClick={(e) => e.stopPropagation()}>
                                            <span className="text-sm mr-2 text-700">{img.name}</span>
                                            <i className="pi pi-times text-red-500 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}></i>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons Section */}
            <div className="sticky bottom-0 z-5 flex gap-2 justify-content-center p-4 bg-transparent border-none">
                <Button label="ຍົກເລີກ" icon="pi pi-times" severity="danger" outlined className="w-8rem bg-transparent text-red-500 border-red-500 hover:surface-100" onClick={handleCancel} disabled={isSubmitting} />
                <Button label="ປ້ອນໃໝ່" icon="pi pi-refresh" severity="warning" outlined className="w-8rem bg-transparent text-orange-500 border-orange-500 hover:surface-100" onClick={handleReset} disabled={isSubmitting} />
                <Button label={isSubmitting ? "ກຳລັງສົ່ງ..." : "ສົ່ງຄຳຮ້ອງຂໍ"} icon="pi pi-send" className="w-11rem" onClick={handleSubmit} loading={isSubmitting} />
            </div>
        </div>
    );
};

export default RequestForm;