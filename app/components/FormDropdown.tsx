"use client";

import React, { useId } from "react";
import { Dropdown, DropdownProps, DropdownChangeEvent } from "primereact/dropdown";

export interface FormDropdownProps extends Omit<DropdownProps, 'optionLabel' | 'optionValue'> {
  label: string;
  error?: string;
  /** Class ครอบ (layout เช่น field col-12, form-group) */
  className?: string;
  /** ชื่อฟิลด์ — ถ้ามี จะส่ง onChange(e, name) สำหรับฟอร์มที่ใช้ field name */
  name?: string;
  /** Key ใน option object สำหรับแสดง (default 'name' สำหรับ options แบบ { name, ... }) */
  optionLabel?: string;
  /** Key ใน option object สำหรับ value (ไม่ใส่ = ใช้ทั้ง object เป็น value) */
  optionValue?: string;
}

export function FormDropdown({
  label,
  error,
  className,
  id: idProp,
  name,
  optionLabel = 'name',
  optionValue,
  onChange,
  placeholder,
  filterBy,
  filterPlaceholder,
  emptyMessage,
  ...props
}: FormDropdownProps) {
  const generatedId = useId();
  const inputId = idProp ?? name ?? generatedId;

  const handleChange = (e: DropdownChangeEvent) => {
    if (name !== undefined && typeof onChange === 'function') {
      (onChange as (ev: DropdownChangeEvent, fieldName: string) => void)(e, name);
    } else {
      onChange?.(e);
    }
  };

  return (
    <div className={className}>
      <label htmlFor={inputId} className="font-bold mb-2 block">
        {label}
      </label>
      <Dropdown
        id={inputId}
        optionLabel={optionLabel}
        optionValue={optionValue}
        className={`w-full ${error ? 'p-invalid' : ''}`}
        onChange={handleChange}
        placeholder={placeholder ?? (optionValue ? '(ກະລຸນາເລືອກ)' : undefined)}
        filterBy={filterBy ?? (optionLabel === 'label' ? 'label' : optionLabel)}
        filterPlaceholder={filterPlaceholder ?? 'ຄົ້ນຫາ...'}
        emptyMessage={emptyMessage ?? 'ບໍ່ພົບຂໍ້ມູນ'}
        {...props}
      />
      {error && <small className="p-error block">{error}</small>}
    </div>
  );
}
