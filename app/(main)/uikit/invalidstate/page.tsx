"use client";
import React, { useMemo } from "react";
import { Editor } from "primereact/editor";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext"; 
import { useTicketForm } from './useTicketForm';
import { FormDropdown } from '../../../components/FormDropdown';

const RequestForm = () => {
    // Destructure ຄ່າ ແລະ function ຈາກ Hook
    const {
        form,
        masterData,
        availableTopics,
        isSubmitting,
        isCategoryLocked,
        updateField,
        handleCategoryChange,
        handleBuildingChange,
        handleLevelChange,
        handleFileSelect,
        handleSubmit,
        handleReset,
        handleCancel,
        fileInputRef
    } = useTicketForm();

    // Editor Header Configuration
    const editorHeader = useMemo(() => (
        <span className="ql-formats">
            <button className="ql-bold" aria-label="Bold"></button>
            <button className="ql-italic" aria-label="Italic"></button>
            <button className="ql-underline" aria-label="Underline"></button>
        </span>
    ), []);

    return (
        // 1. เพิ่ม p-0 เพื่อลบขอบขาวรอบนอกออก ให้ Header ชิดขอบ
        // 2. เพิ่ม overflow-hidden เพื่อให้มุมโค้งของ Header ไม่เกินออกมานอก Card
        <div className="card text-base p-0 overflow-hidden">   
            {/* --- HEADER SECTION --- */}
            {/* - bg-bluegray-50: พื้นหลังสีเทาจาง
                - border-bottom-1 border-yellow-200: เส้นขอบล่างสีเหลืองอ่อน
                - justify-content-center: จัดข้อความให้อยู่ตรงกลาง (Center)
                - p-3: ระยะห่างภายใน Header
            */}
            <div className="flex align-items-center justify-content-center p-3 bg-bluegray-50 border-bottom-1 border-yellow-200">
                <i className="pi pi-id-card text-yellow-600 mr-2 text-xl"></i>
                <div className="flex flex-wrap gap-2 text-800 font-bold">
                    <span>ພາກສ່ວນຮ້ອງຂໍ:</span>
                    <span>ຝ່າຍພັດທະນາ-ຄຸ້ມຄອງ-ບຳລຸງຮັກສາ | ພະແນກສູນຂໍ້ມູນ | ທ. ດາລິສັກ ສິມສະໝຸດ</span>
                </div>
            </div>
            {/* ---------------------- */}

            {/* เพิ่ม padding (p-4) ในส่วนเนื้อหาแทน เพราะเราลบออกจาก card ด้านบนแล้ว */}
            <div className="p-fluid p-4">

                {/* 1. Category (ໝວດໝູ່) */}
                <div className="field mb-3">
                    <label htmlFor="category" className="font-bold block mb-2">ໝວດໝູ່</label>
                    <InputText
                        id="category"
                        value={form.category?.name || ''}
                        onChange={(e) => handleCategoryChange({ name: e.target.value })}
                        placeholder="ໃສ່ຊື່ໝວດໝູ່"
                        disabled={isCategoryLocked}
                        className="w-full font-bold"
                    />
                </div>

                {/* 2. Topic (ຫົວຂໍ້) */}
                <FormDropdown
                    className="field mb-3"
                    label="ຫົວຂໍ້*"
                    value={form.topic}
                    options={availableTopics}
                    onChange={(e) => updateField('topic', e.value)}
                    disabled={!form.category} 
                    placeholder={form.category ? "ເລືອກຫົວຂໍ້ບັນຫາ" : "ກະລຸນາເລືອກໝວດໝູ່ກ່ອນ"}
                    emptyMessage="ບໍ່ພົບຫົວຂໍ້ຂອງໝວດໝູ່ນີ້"
                />

                {/* Grid Layout */}
                <div className="formgrid grid">
                    {/* 3. Building */}
                    <FormDropdown
                        className="field col-12 md:col-4"
                        label="ຕຶກ/ອາຄານ*"
                        value={form.building}
                        options={masterData?.buildings || []}
                        onChange={(e) => handleBuildingChange(e.value)}
                        placeholder="ເລືອກ"
                    />

                    {/* 4. Level */}
                    <FormDropdown
                        className="field col-12 md:col-4"
                        label="ລະດັບຊັ້ນ*"
                        value={form.level}
                        options={masterData?.levels || []}
                        onChange={(e) => handleLevelChange(e.value)}
                        disabled={!form.building}
                        placeholder="ເລືອກ"
                    />

                    {/* 5. Room */}
                    <FormDropdown
                        className="field col-12 md:col-4"
                        label="ໝາຍເລກຫ້ອງ (ວ່າງໄດ້)"
                        value={form.roomNumber}
                        options={masterData?.rooms || []}
                        onChange={(e) => updateField('roomNumber', e.value)}
                        disabled={!form.level}
                        placeholder="ເລືອກ"
                        showClear
                    />
                </div>

                {/* 6. Details (Editor) */}
                <div className="field mb-4">
                    <label className="font-bold mb-2 block">ລາຍລະອຽດເພີ່ມເຕີມ</label>
                    <Editor
                        value={form.description}
                        onTextChange={(e) => updateField('description', e.htmlValue)}
                        headerTemplate={editorHeader}
                        style={{ height: '150px' }}
                    />
                </div>

                {/* 7. Attachment */}
                <div className="field mb-5">
                    <label className="font-bold mb-2 block"> <i className="pi pi-paperclip mr-2"></i> ແນບໄຟລ໌</label>
                    <div
                        className="border-dashed border-1 border-300 border-round p-4 flex align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors"
                        style={{ backgroundColor: '#fff', minHeight: '60px' }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                        {form.attachment ? (
                            <span className="text-primary font-bold text-sm flex align-items-center">
                                <i className="pi pi-file mr-2"></i> {form.attachment.name}
                            </span>
                        ) : (
                            <span className="text-500 text-sm">
                                ຄິກທີ່ນີ້ເພື່ອແນບໄຟລ໌
                            </span>
                        )}
                    </div>
                </div>

                {/* 8. Buttons Section */}
                <div className="flex gap-2 justify-content-center mt-5">
                    <Button
                        label="ຍົກເລີກ"
                        severity="secondary"
                        outlined
                        className="w-8rem"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    />
                    
                    <Button
                        label="ປ້ອນໃໝ່"
                        severity="warning"
                        outlined
                        className="w-8rem"
                        onClick={handleReset}
                        disabled={isSubmitting}
                    />
                    
                    <Button
                        label={isSubmitting ? "ກຳລັງສົ່ງ..." : "ສົ່ງຄຳຮ້ອງຂໍ"}
                        icon="pi pi-send"
                        className="w-10rem"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                    />
                </div>

            </div>
        </div>
    );
};

export default RequestForm;