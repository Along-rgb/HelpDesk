"use client";
import React from "react";
import { Dropdown, DropdownProps } from "primereact/dropdown";

// กำหนด Type: รับทุกอย่างที่ Dropdown รับได้ + label และ error (มีก็ได้ ไม่มีก็ได้)
interface CustomDropdownProps extends DropdownProps {
    label: string;
    error?: any;
}

export const FormDropdown = ({ label, error, className, ...props }: CustomDropdownProps) => {
    // className ที่ส่งมาจะไปอยู่ที่ Div ครอบ (เอาไว้จัด Layout เช่น col-4, mb-3)
    return (
        <div className={className}>
            <label className="font-bold mb-2 block">
                {label}
            </label>
            <Dropdown
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