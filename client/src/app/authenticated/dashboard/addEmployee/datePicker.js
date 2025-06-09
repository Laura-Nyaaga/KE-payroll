import React from 'react';
import { useFormContext } from 'react-hook-form';

const DatePickerField = ({ name, label, required = false }) => {
  const { register, formState: { errors } } = useFormContext();
  
  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" + 
    " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
  const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  
  const errorClass = "text-[var(--error-color)] text-sm mt-1";

  return (
    <div className="relative">
      {label && <label htmlFor={name} className={labelClass}>{label}</label>}
      <input
        type="date"
        id={name}
        {...register(name, { required: required ? `${label || name} is required` : false })}
        className={inputClass}
      />
      {errors?.[name] && <p className={errorClass}>{errors[name].message}</p>}
    </div>
  );
};

export default DatePickerField;