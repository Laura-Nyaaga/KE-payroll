// In paymentMethod.js
import React from 'react';
import { useFormContext } from 'react-hook-form';

// Modal component for any payment method details
const PaymentMethodModal = ({ isOpen, onClose, onSave, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
                {children}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onSave}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bank details modal content
const BankDetailsModal = ({ isOpen, onClose, onSave, errors }) => {
  const { register, trigger, setValue } = useFormContext();
  
  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black border-gray-200";
  const errorClass = "text-red-500 text-sm mt-1";

  // Handle save button click - only validate specific fields
  const handleSave = async () => {
    // Only validate bank fields before saving
    const isValid = await trigger(['bankName', 'bankCode', 'accountNumber', 'accountName', 'branchName', 'branchCode']);
    
    if (isValid) {
      // Set the paymentMethodDetails field to pass validation
      setValue("paymentMethodDetails", "valid");
      
      // Trigger validation for the entire form
      trigger().then(() => {
        if (onSave) {
          onSave();
        }
      });
    }
  };

  return (
    <PaymentMethodModal 
      isOpen={isOpen} 
      onClose={onClose}
      onSave={handleSave}
      title="Bank Payment Details"
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Account Name</label>
          <input
            {...register("accountName", { 
              required: "Account name is required" 
            })}
            placeholder="Account Name"
            className={inputClass}
          />
          {errors?.accountName && <p className={errorClass}>{errors.accountName.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Account Number</label>
          <input
            {...register("accountNumber", { 
              required: "Account number is required",
              pattern: {
                value: /^[0-9]{5,20}$/,
                message: "Account number must be between 5 and 20 digits"
              }
            })}
            placeholder="Account Number"
            className={inputClass}
          />
          {errors?.accountNumber && <p className={errorClass}>{errors.accountNumber.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Bank Name</label>
          <input
            {...register("bankName", { 
              required: "Bank name is required" 
            })}
            placeholder="Bank Name"
            className={inputClass}
          />
          {errors?.bankName && <p className={errorClass}>{errors.bankName.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Bank Code</label>
          <input
            {...register("bankCode", {
              required: "Bank code is required",
              minLength: { value: 3, message: "Bank code must be at least 3 characters" },
              maxLength: { value: 20, message: "Bank code must be less than 20 characters" }
            })}
            placeholder="Bank Code"
            className={inputClass}
          />
          {errors?.bankCode && <p className={errorClass}>{errors.bankCode.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Branch Name</label>
          <input
            {...register("branchName", {
              required: "Branch name is required"
            })}
            placeholder="Branch Name"
            className={inputClass}
          />
          {errors?.branchName && <p className={errorClass}>{errors.branchName.message}</p>}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Branch Code</label>
          <input
            {...register("branchCode", {
              required: "Branch code is required",
              minLength: { value: 3, message: "Branch code must be at least 3 characters" },
              maxLength: { value: 20, message: "Branch code must be less than 20 characters" }
            })}
            placeholder="Branch Code"
            className={inputClass}
          />
          {errors?.branchCode && <p className={errorClass}>{errors.branchCode.message}</p>}
        </div>
      </div>
    </PaymentMethodModal>
  );
};

// Mobile Money details modal content
const MobileMoneyDetailsModal = ({ isOpen, onClose, onSave, errors }) => {
  const { register, trigger, setValue, getValues } = useFormContext();
  
  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black border-gray-200";
  const errorClass = "text-red-500 text-sm mt-1";


  const handleSave = async () => {
    // Validate mobile number field before saving
    const isValid = await trigger('mobileNumber');
    if (isValid) {
      // Get the current mobile number value
      const mobileNumberValue = getValues('mobileNumber');
      // Explicitly set the value with options to validate and mark as dirty
      setValue('mobileNumber', mobileNumberValue, {
        shouldValidate: true,
        shouldDirty: true
      });
      // Also set paymentMethod to ensure consistency
      setValue('methodOfPayment', 'mobileMoney', {
        shouldValidate: true,
        shouldDirty: true
      });
      // Set paymentMethodDetails to valid
      setValue('paymentMethodDetails', 'valid', {
        shouldValidate: true,
        shouldDirty: true
      });
      // Close modal and mark as complete
      if (onSave) {
        onSave();
      }
    }
  };

  return (
    <PaymentMethodModal 
      isOpen={isOpen} 
      onClose={onClose}
      onSave={handleSave}
      title="Mobile Money Payment Details"
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-1 text-gray-700">Mobile Number</label>
          <input
            {...register("mobileNumber", { 
              required: "Mobile number is required",
              pattern: {
                value: /^[0-9]{7,15}$/,
                message: "Please enter a valid phone number (7-15 digits)"
              }
            })}
            placeholder="e.g. 0712345678"
            className={inputClass}
          />
          {errors?.mobileNumber && <p className={errorClass}>{errors.mobileNumber.message}</p>}
        </div>
      </div>
    </PaymentMethodModal>
  );
};

export { BankDetailsModal, MobileMoneyDetailsModal };