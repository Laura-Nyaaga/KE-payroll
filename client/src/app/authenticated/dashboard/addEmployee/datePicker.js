import React from 'react';
import { useFormContext } from 'react-hook-form';

const DatePickerField = ({ name, label, required = false, disabled = false, onBlur: parentOnBlur }) => {
  const { 
    register, 
    formState: { errors }, 
    setValue, // <--- CRITICAL: Get setValue
    watch,    // <--- CRITICAL: Get watch
    trigger   // <--- CRITICAL: Get trigger
  } = useFormContext();

  // Watch the current value of this field from react-hook-form's state
  const fieldValue = watch(name);

  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" + 
    " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
  const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  
  const errorClass = "text-[var(--error-color)] text-sm mt-1";

  // Function to format the date for the input type="date"
  // It expects a Date object or a string that can be converted to one.
  // input type="date" requires 'YYYY-MM-DD' format.
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) { // Check for invalid date
        return '';
    }
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="relative">
      {label && <label htmlFor={name} className={labelClass}>{label}</label>}
      <input
        type="date"
        id={name}
        // CRITICAL: Bind the value to RHF's watched value
        value={formatDateForInput(fieldValue)} 
        // CRITICAL: Update RHF state via setValue on change
        onChange={(e) => {
          // setValue will update RHF's internal state.
          // Using e.target.value directly (which is 'YYYY-MM-DD') is fine for date inputs.
          setValue(name, e.target.value, { shouldValidate: true, shouldDirty: true });
        }}
        // RHF's register for validation, but value/onChange are handled manually above
        {...register(name, { 
          required: required ? `${label || name} is required` : false,
          // You might not need onBlur here if you're calling trigger in onChange already,
          // but if you want validation on blur specifically, you can keep it.
          onBlur: () => {
            trigger(name); // Trigger validation for this field on blur
            if (parentOnBlur) { // Call any onBlur passed from parent
              parentOnBlur();
            }
          }
        })}
        className={inputClass}
        disabled={disabled} // Apply the disabled prop
      />
      {errors?.[name] && <p className={errorClass}>{errors[name].message}</p>}
    </div>
  );
};

export default DatePickerField;