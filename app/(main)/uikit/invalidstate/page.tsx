"use client";

import React, { useMemo } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useTicketForm } from "./useTicketForm";
import { FormDropdown } from "@/app/components/FormDropdown";
import { useProfileData } from "@/app/store/user/userProfileStore";

const RequestForm = () => {
  const {
    form,
    masterData,
    levelOptions,
    loadingMaster,
    isSubmitting,
    canSubmit,
    updateField,
    handleBuildingChange,
    handleLevelChange,
    handleFileSelect,
    handleRemoveFile,
    handleImageSelect,
    handleRemoveImage,
    handleRemoveExistingAttachment,
    handleRemoveExistingImage,
    handleSubmit,
    handleReset,
    handleCancel,
    fileInputRef,
    imageInputRef,
    toastRef,
  } = useTicketForm();
  const { profileData } = useProfileData();

  const requestingPartyText = useMemo(() => {
    if (!profileData) return "";
    const parts = [
      profileData.department_name?.trim(),
      profileData.division_name?.trim(),
      [profileData.first_name, profileData.last_name].filter(Boolean).join(" ").trim(),
    ].filter(Boolean);
    return parts.join(" | ");
  }, [profileData]);

  const grayFieldStyle = { backgroundColor: "#f4f4f4", fontWeight: "500" };
  const grayDropdownStyle = { backgroundColor: "#f4f4f4", color: "#000", fontWeight: "500" };
  const whiteFieldStyle = { backgroundColor: "#fff", color: "#000", fontWeight: "500" };

  return (
    <div className="relative pb-8">
      <Toast ref={toastRef} position="top-center" />
      <div className="card text-base p-0 relative mb-4">
        <div className="flex align-items-center justify-content-center p-3 bg-bluegray-50 border-bottom-1 border-yellow-200">
          <i className="pi pi-id-card text-yellow-600 mr-2 text-xl" />
          <div className="flex flex-wrap gap-2 text-800 font-bold">
            <span>ພາກສ່ວນຮ້ອງຂໍ:</span>
            <span>{requestingPartyText || "—"}</span>
          </div>
        </div>

        <div className="p-fluid p-4">
          {loadingMaster && (
            <div className="flex align-items-center gap-2 text-500 mb-3">
              <i className="pi pi-spin pi-spinner" />
              <span>ກຳລັງໂຫລດຂໍ້ມູນ...</span>
            </div>
          )}
          <div className="formgrid grid mb-3">
            <div className="field col-12 md:col-6">
              <label htmlFor="topic" className="font-bold block mb-2">
                ຫົວຂໍ້
              </label>
              <InputText
                id="topic"
                value={form.topic?.name ?? ""}
                readOnly
                className="w-full"
                style={grayFieldStyle}
              />
            </div>
            <div className="field col-12 md:col-6">
              <label htmlFor="numberSKT" className="font-bold block mb-2">
                ເລກ ຊຄທ
              </label>
              <InputText
                id="numberSKT"
                value={form.assetNumber}
                onChange={(e) => updateField("assetNumber", e.target.value)}
                className="w-full"
                style={whiteFieldStyle}
                placeholder="ກະລຸນາເພີ່ມເລກ ຊຄທ"
              />
            </div>
          </div>

          <div className="formgrid grid mb-3">
            <FormDropdown
              className="field col-12 md:col-4"
              label="ຕຶກ/ອາຄານ*"
              value={form.building}
              options={masterData?.buildings ?? []}
              onChange={(e) => handleBuildingChange(e.value)}
              style={grayDropdownStyle}
            />
            <FormDropdown
              className="field col-12 md:col-4"
              label="ລະດັບຊັ້ນ*"
              value={form.level}
              options={levelOptions}
              onChange={(e) => handleLevelChange(e.value)}
              disabled={!form.building}
              style={grayDropdownStyle}
            />
            <div className="field col-12 md:col-4">
              <label htmlFor="room" className="font-bold block mb-2">
                ໝາຍເລກຫ້ອງ (ວ່າງໄດ້)
              </label>
              <InputText
                id="room"
                value={form.room}
                onChange={(e) => updateField("room", e.target.value)}
                inputMode="numeric"
                className="w-full"
                style={whiteFieldStyle}
                placeholder=""
              />
            </div>
          </div>

          <div className="field mb-3">
            <label htmlFor="telephone" className="font-bold block mb-2">
              ເບີໂທ
            </label>
            <InputText
              id="telephone"
              value={form.phoneNumber ?? ""}
              onChange={(e) => updateField("phoneNumber", e.target.value)}
              inputMode="numeric"
              className="w-full"
              style={whiteFieldStyle}
              placeholder="ກະລຸນາເພີ່ມເບີໂທ "
            />
          </div>
          <div className="field mb-3">
            <FormDropdown
              label="ເສັ້ນທາງ"
              value={form.route}
              options={masterData?.routes ?? []}
              onChange={(e) => updateField("route", e.value)}
              placeholder="ກະລຸນາເລືອກເສັ້ນທາງ"
              showClear
              style={grayDropdownStyle}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="details" className="font-bold mb-2 block">
              ລາຍລະອຽດເພີ່ມເຕີມ
            </label>
            <InputTextarea
              id="details"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value ?? "")}
              rows={5}
              className="w-full"
              style={whiteFieldStyle}
              placeholder="ກະລຸນາປ້ອນລາຍລະອຽດ"
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="invalidstate-attachment" className="font-bold block mb-2">
              <i className="pi pi-paperclip mr-2" /> ແນບໄຟລ໌
            </label>
            <div
              className={`border-dashed border-1 border-300 border-round p-4 flex flex-column align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors ${form.attachments.length >= 2 ? "opacity-70" : ""}`}
              onClick={() => {
                if (form.attachments.length < 2) fileInputRef.current?.click();
              }}
            >
              <input
                id="invalidstate-attachment"
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileSelect}
                accept=".pdf,application/pdf"
              />
              {form.existingAttachments.length > 0 && (
                <div className="w-full flex flex-column align-items-center gap-2 mb-2">
                  {form.existingAttachments.map((f, i) => (
                    <div
                      key={i}
                      className="flex align-items-center justify-content-between w-full md:w-8 surface-100 border-round px-3 py-2 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex align-items-center gap-2 no-underline text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="pi pi-file-pdf text-red-500" />
                        <span className="text-sm font-medium">{f.name}</span>
                      </a>
                      <Button
                        icon="pi pi-times"
                        rounded
                        text
                        severity="danger"
                        onClick={(e) => { e.stopPropagation(); handleRemoveExistingAttachment(i); }}
                      />
                    </div>
                  ))}
                </div>
              )}
              {form.existingAttachments.length === 0 && form.attachments.length === 0 && (
                <span className="text-500 text-sm">ຄິກທີ່ນີ້ເພື່ອແນບໄຟລ໌</span>
              )}
              {form.attachments.length > 0 && (
                <div className="w-full flex flex-column align-items-center gap-2">
                  {form.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex align-items-center justify-content-between w-full md:w-8 surface-100 border-round px-3 py-2 shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-900 font-medium text-sm">{file.name}</span>
                      <Button
                        icon="pi pi-times"
                        rounded
                        text
                        severity="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="field mb-5">
            <div className="flex justify-content-between align-items-center mb-2">
              <label htmlFor="invalidstate-images" className="font-bold block m-0">
                <i className="pi pi-images mr-2" /> ແນບຮູບ
              </label>
              <span className="text-sm font-medium text-600">
                ຈຳນວນຮູບ ({form.images.length}/5)
              </span>
            </div>
            <div
              className={`border-dashed border-1 border-round p-4 flex flex-column align-items-center justify-content-center cursor-pointer hover:surface-hover transition-colors ${form.images.length >= 5 ? "opacity-70" : ""}`}
              onClick={() => {
                if (form.images.length < 5) imageInputRef.current?.click();
              }}
            >
              <input
                id="invalidstate-images"
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/png,image/jpeg,image/gif"
                multiple
                onChange={handleImageSelect}
              />
              {form.existingImages.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-content-center w-full mb-2">
                  {form.existingImages.map((img, i) => (
                    <div key={i} className="flex flex-column align-items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <div className="relative">
                        <a href={img.url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={img.url}
                            alt={img.name}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e0e0e0', display: 'block' }}
                          />
                        </a>
                        <button
                          type="button"
                          style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: '11px', lineHeight: 1 }}
                          onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(i); }}
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-xs text-500" style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {form.existingImages.length === 0 && form.images.length === 0 && (
                <span className="text-500 text-sm">ຄິກທີ່ນີ້ເພື່ອແນບຮູບພາບ</span>
              )}
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-content-center w-full">
                  {form.images.map((img, index) => (
                    <div
                      key={index}
                      className="flex align-items-center bg-gray-100 border-round px-3 py-2 shadow-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-sm mr-2 text-700">{img.name}</span>
                      <i
                        className="pi pi-times text-red-500 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-5 flex gap-2 justify-content-center p-4 bg-transparent border-none">
        <Button
          label="ຍົກເລີກ"
          icon="pi pi-times"
          severity="danger"
          outlined
          className="w-8rem bg-transparent text-red-500 border-red-500 hover:surface-100"
          onClick={handleCancel}
          disabled={isSubmitting}
        />
        <Button
          label="ປ້ອນໃໝ່"
          icon="pi pi-refresh"
          severity="warning"
          outlined
          className="w-8rem bg-transparent text-orange-500 border-orange-500 hover:surface-100"
          onClick={handleReset}
          disabled={isSubmitting}
        />
        <Button
          label={isSubmitting ? "ກຳລັງສົ່ງ..." : "ສົ່ງຄຳຮ້ອງຂໍ"}
          icon="pi pi-send"
          className="w-11rem"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !canSubmit}
        />
      </div>
    </div>
  );
};

export default RequestForm;
