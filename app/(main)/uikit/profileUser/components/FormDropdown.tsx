import React from 'react';
import { Dropdown } from 'primereact/dropdown';

interface DropdownOption {
  label: string;
  code: string | number;
}

interface FormDropdownProps {
  label: string;
  value?: string | number;
  onChange: (e: any, name: string) => void;
  name: string;
  id?: string;
  options: DropdownOption[];
  disabled?: boolean;
  showClear?: boolean;
  /** ເປີດຊ່ອງຄົ້ນຫາ (filter) */
  filter?: boolean;
}

const FormDropdown: React.FC<FormDropdownProps> = ({
  label,
  value,
  onChange,
  name,
  id,
  options,
  disabled = false,
  showClear = false,
  filter = false,
}) => {
  const inputId = id ?? name;
  return (
    <div className="form-group">
      <label htmlFor={inputId}>{label}</label>
      <Dropdown
        id={inputId}
        value={value}
        onChange={(e) => onChange(e, name)}
        options={options}
        optionLabel="label"
        optionValue="code"
        placeholder="(ກະລຸນາເລືອກ)"
        disabled={disabled}
        showClear={showClear}
        filter={filter}
        filterBy="label"
        filterPlaceholder="ຄົ້ນຫາ..."
        className="w-full"
        emptyMessage="ບໍ່ພົບຂໍ້ມູນ"
      />
    </div>
  );
};

export default FormDropdown;
