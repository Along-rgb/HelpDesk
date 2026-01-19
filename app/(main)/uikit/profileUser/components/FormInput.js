import React from 'react';
import { InputText } from 'primereact/inputtext';

const FormInput = ({ label, value, onChange, name, disabled, readOnly, type = "text" }) => {
  return (
    <div className="form-group">
      <label>{label}</label>
      <InputText 
        type={type}
        name={name}
        value={value || ''} // ป้องกัน error กรณี value เป็น null
        onChange={onChange}
        disabled={disabled}
        className={readOnly ? 'input-readonly-highlight' : ''}
        readOnly={readOnly}
      />
    </div>
  );
};

export default FormInput;