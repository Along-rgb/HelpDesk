import React from 'react';
import { Dropdown } from 'primereact/dropdown';

const FormDropdown = ({ label, value, onChange, name, options, disabled, showClear }) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <Dropdown
        value={value}
        onChange={(e) => onChange(e, name)} // ส่ง name กลับไปเพื่อให้ handle ง่ายขึ้น
        options={options}
        optionLabel="label"
        optionValue="code"
        placeholder="(ກະລຸນາເລືອກ)"
        disabled={disabled}
        showClear={showClear}
        className="w-full"
        emptyMessage="ບໍ່ພົບຂໍ້ມູນ"
      />
    </div>
  );
};

export default FormDropdown;