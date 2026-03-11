"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import type { Ticket } from "./types";
import type { ReportWorkFormData } from "./types";

interface ReportWorkModalProps {
  visible: boolean;
  onHide: () => void;
  ticket: Ticket | null;
  onSave: (ticketId: string | number, data: ReportWorkFormData) => Promise<void>;
}

const initialForm: ReportWorkFormData = {
  workDetail: "",
  completedDate: null,
  imageFiles: [],
};

export function ReportWorkModal({
  visible,
  onHide,
  ticket,
  onSave,
}: ReportWorkModalProps) {
  const [workDetail, setWorkDetail] = useState(initialForm.workDetail);
  const [completedDate, setCompletedDate] = useState<Date | null>(initialForm.completedDate);
  const [imageFiles, setImageFiles] = useState<File[]>(initialForm.imageFiles);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!visible) {
      setWorkDetail(initialForm.workDetail);
      setCompletedDate(initialForm.completedDate);
      setImageFiles(initialForm.imageFiles);
    }
  }, [visible]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setImageFiles(Array.from(files));
  };

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      await onSave(ticket.id, {
        workDetail,
        completedDate,
        imageFiles,
      });
      onHide();
    } finally {
      setSaving(false);
    }
  };

  const fileNames = imageFiles.length
    ? imageFiles.map((f) => f.name).join(", ")
    : "";

  return (
    <Dialog
      header={ticket != null ? `ລາຍງານວຽກ #${ticket.id} ${ticket.title ?? ""}`.trim() : "ລາຍງານວຽກ"}
      visible={visible}
      onHide={onHide}
      style={{ width: "450px" }}
      contentStyle={{ padding: "1rem 1.5rem", overflow: "visible" }}
      draggable={false}
    >
      <div className="p-fluid">
        <div className="field">
          <label htmlFor="report-work-detail">ລາຍລະອຽດວຽກງານທີ່ປະຕິບັດສຳເລັດ</label>
          <InputTextarea
            id="report-work-detail"
            value={workDetail}
            onChange={(e) => setWorkDetail(e.target.value ?? "")}
            rows={4}
            placeholder="ກະລຸນາ ປ້ອນ ລາຍລະອຽດ"
            className="w-full"
          />
        </div>

        <div className="field">
          <label htmlFor="report-work-date">ວັນທີສໍາເລັດ</label>
          <Calendar
            id="report-work-date"
            value={completedDate}
            onChange={(e) => setCompletedDate(e.value ?? null)}
            dateFormat="mm/dd/yy"
            showIcon
            placeholder="mm/dd/yyyy"
            className="w-full"
          />
        </div>

        <div className="field">
          <label>ຮູບພາບ</label>
          <div className="flex align-items-center gap-2">
            <InputText
              value={fileNames}
              readOnly
              className="flex-1 w-full"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              label="ເລືອກໄຟລ໌"
              icon="pi pi-upload"
              className="p-button-outlined p-button-secondary"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-4 pt-3" style={{ width: "100%", justifyContent: "center", borderTop: "1px solid #e5e7eb" }}>
          <Button
            label="ປິດອອກ"
            icon="pi pi-times"
            className="p-button-secondary"
            onClick={onHide}
            disabled={saving}
          />
          <Button
            label="ບັນທຶກ"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          />
        </div>
      </div>
    </Dialog>
  );
}
