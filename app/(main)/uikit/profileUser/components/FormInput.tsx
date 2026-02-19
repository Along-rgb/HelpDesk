import React from 'react';
import { InputText } from 'primereact/inputtext';

interface FormInputProps {
  label: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  name,
  id,
  disabled = false,
  readOnly = false,
  type = "text"
}) => {
  const inputId = id ?? name ?? undefined;
  return (
    <div className="form-group">
      <label htmlFor={inputId}>{label}</label>
      <InputText
        id={inputId}
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
