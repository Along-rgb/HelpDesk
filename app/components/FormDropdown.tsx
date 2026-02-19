"use client";
import React, { useId } from "react";
import { Dropdown, DropdownProps } from "primereact/dropdown";

// กำหนด Type: รับทุกอย่างที่ Dropdown รับได้ + label และ error (มีก็ได้ ไม่มีก็ได้)
interface CustomDropdownProps extends DropdownProps {
    label: string;
    error?: any;
}

export const FormDropdown = ({ label, error, className, id: idProp, ...props }: CustomDropdownProps) => {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;
    // className ที่ส่งมาจะไปอยู่ที่ Div ครอบ (เอาไว้จัด Layout เช่น col-4, mb-3)
    return (
        <div className={className}>
            <label htmlFor={inputId} className="font-bold mb-2 block">
                {label}
            </label>
            <Dropdown
                id={inputId}
                // w-full เพื่อให้ยืดเต็ม container ที่ครอบมันอยู่
                className={`w-full ${error ? 'p-invalid' : ''}`}
                optionLabel="name"
                {...props} // ส่ง props อื่นๆ (เช่น value, onChange) เข้าไปทำงานต่อ
            />
            {/* ส่วนแสดง Error Message (ถ้ามี) */}
            {error && <small className="p-error block">{error}</small>}
        </div>
    );
};