// paymentMethod.js (your modal components)
"use client";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";

// Modal component for any payment method details
const PaymentMethodModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center min-h-screen p-4">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity"
        aria-hidden="true"
        onClick={onClose} // This only closes if you click *outside* the modal content
      />

      {/* Modal panel */}
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl w-full mx-4 sm:mx-auto relative z-10">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {/* Children (which will contain the form fields and buttons) are rendered here */}
        {children}
      </div>
    </div>
  );
};

// Common field props - Accepts register and trigger now
const inputProps = (
  name,
  register,
  trigger,
  required = false,
  pattern = null
) => ({
  ...register(name, {
    required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
    pattern,
    onBlur: () => trigger(name),
  }),
  className:
    "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
});

// Bank details modal content
export const BankDetailsModal = ({
  isOpen,
  onClose,
  onSave,
  errors,
  initialData,
}) => {
  const { register, trigger, setValue, getValues, watch } = useFormContext();

  // Effect to set initial values for modal fields from initialData prop
  useEffect(() => {
    if (isOpen && initialData) {
      const currentFormValues = getValues();
      Object.keys(initialData).forEach((key) => {
        if (
          initialData[key] !== undefined &&
          initialData[key] !== null &&
          currentFormValues[key] !== initialData[key]
        ) {
          setValue(key, initialData[key], {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });
    }
  }, [initialData, setValue, getValues, isOpen, trigger]);

  // Repopulate Account Name with employee's full name
  useEffect(() => {
    if (isOpen) {
      const currentAccountName = getValues("accountName");
      const personalDetails = watch("personalDetails");

      if (
        !currentAccountName &&
        personalDetails &&
        personalDetails.firstName &&
        !initialData?.accountName
      ) {
        const firstName = personalDetails.firstName;
        const middleName = personalDetails.middleName;
        const lastName = personalDetails.lastName;
        const fullName = [firstName, middleName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (fullName && fullName !== currentAccountName) {
          setValue("accountName", fullName, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      }
    }
  }, [
    isOpen,
    watch("personalDetails.firstName"),
    watch("personalDetails.middleName"),
    watch("personalDetails.lastName"),
    setValue,
    getValues,
    initialData?.accountName,
  ]);

  const handleSave = async () => {
    // Removed `e` parameter as it's no longer an onSubmit event
    // Validate only the bank-specific fields for the modal
    const fieldsToValidate = [
      "bankName",
      "accountNumber",
      "accountName",
      "bankCode",
      "branchName",
      "branchCode",
    ];
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      const bankDetails = {
        bankName: getValues("bankName"),
        accountNumber: getValues("accountNumber"),
        bankCode: getValues("bankCode"),
        branchName: getValues("branchName"),
        branchCode: getValues("branchCode"),
        accountName: getValues("accountName"),
      };
      onSave(bankDetails); // Pass the collected data back to the parent
    } else {
      console.log("Bank details validation failed in modal.");
    }
  };

  return (
    <PaymentMethodModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bank Payment Details"
    >
      {/* REMOVED THE <form> TAG HERE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Account Name*
            </label>
            <input
              {...inputProps("accountName", register, trigger, true, {
                minLength: {
                  value: 2,
                  message: "Account name must be at least 2 characters",
                },
                pattern: {
                  value: /^[A-Za-z\s]+$/,
                  message: "Only letters are allowed",
                },
              })}
              placeholder="Enter account name"
              onInput={(e) => {
                e.target.value = e.target.value
                  .replace(/[^A-Za-z\s]/g, "")
                  .toUpperCase();
                trigger("accountName");
              }}
              onKeyDown={(e) => {
                if (!/[A-Za-z\s]/.test(e.key) && e.key.length === 1) {
                  e.preventDefault();
                }
              }}
            />
            {errors?.accountName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.accountName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Account Number*
            </label>
           <input
  {...inputProps("accountNumber", register, trigger, true, {
    pattern: {
      value: /^[0-9]{5,20}$/,
      message: "Account number must be 5-20 digits",
    },
  })}
  placeholder="Enter account number"
  type="tel" 
  onKeyDown={(e) => {
    if (!/[0-9]/.test(e.key) && 
        !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
  }}
  onInput={(e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    trigger('accountNumber'); 
  }}
  maxLength={20}
/>
            {errors?.accountNumber && (
              <p className="text-red-500 text-xs mt-1">
                {errors.accountNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Bank Name*
            </label>
            <input
              {...inputProps("bankName", register, trigger, true, {
                minLength: {
                  value: 2,
                  message: "Bank name must be at least 2 characters",
                },
              })}
              placeholder="Enter bank name"
            />
            {errors?.bankName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.bankName.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Bank Code*
            </label>
            <input
              {...inputProps("bankCode", register, trigger, true, {
                minLength: {
                  value: 3,
                  message: "Bank code must be at least 3 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Bank code must be less than 20 characters",
                },
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: "Only alphanumeric characters are allowed",
                },
              })}
              placeholder="Enter bank code"
              onInput={(e) => {
                e.target.value = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase();
                trigger("bankCode"); 
              }}
              onKeyDown={(e) => {
                if (
                  !/^[a-zA-Z0-9]$/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              maxLength={20} 
            />
            {errors?.bankCode && (
              <p className="text-red-500 text-xs mt-1">
                {errors.bankCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Branch Name*
            </label>
            <input
              {...inputProps("branchName", register, trigger, true, {
                minLength: {
                  value: 2,
                  message: "Branch name must be at least 2 characters",
                },
              })}
              placeholder="Enter branch name"
            />
            {errors?.branchName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.branchName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Branch Code*
            </label>
            <input
              {...inputProps("branchCode", register, trigger, true, {
                minLength: {
                  value: 3,
                  message: "Branch code must be at least 3 characters",
                },
                maxLength: {
                  value: 20,
                  message: "Branch code must be less than 20 characters",
                },
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: "Only alphanumeric characters are allowed",
                },
              })}
              placeholder="Enter branch code"
              onInput={(e) => {
                e.target.value = e.target.value
                  .replace(/[^a-zA-Z0-9]/g, "")
                  .toUpperCase();
                trigger("branchCode"); 
              }}
              onKeyDown={(e) => {
                if (
                  !/^[a-zA-Z0-9]$/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "Tab",
                    "ArrowLeft",
                    "ArrowRight",
                    "Home",
                    "End",
                  ].includes(e.key)
                ) {
                  e.preventDefault();
                }
              }}
              maxLength={20} 
            />
            {errors?.branchCode && (
              <p className="text-red-500 text-xs mt-1">
                {errors.branchCode.message}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Buttons connected to handleSave via onClick */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          type="button" 
          onClick={handleSave} 
          className="px-4 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 bg-green-600 text-white hover:bg-green-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 mt-3 sm:mt-0 sm:ml-3"
        >
          Cancel
        </button>
      </div>
      {/* REMOVED THE </form> TAG HERE */}
    </PaymentMethodModal>
  );
};

// Mobile Money details modal content
export const MobileMoneyDetailsModal = ({
  isOpen,
  onClose,
  onSave,
  errors,
  initialData,
}) => {
  const { register, trigger, setValue, getValues } = useFormContext();

  // Effect to set initial values for modal fields from initialData prop
  useEffect(() => {
    if (isOpen && initialData) {
      const currentFormValues = getValues();
      Object.keys(initialData).forEach((key) => {
        if (
          initialData[key] !== undefined &&
          initialData[key] !== null &&
          currentFormValues[key] !== initialData[key]
        ) {
          setValue(key, initialData[key], {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      });
    }
  }, [initialData, setValue, getValues, isOpen, trigger]);

  const handleSave = async () => {
    // Removed `e` parameter
    // Validate only the mobile number field for the modal
    const isValid = await trigger("mobileNumber");
    if (isValid) {
      const mobileDetails = {
        mobileNumber: getValues("mobileNumber"),
      };
      onSave(mobileDetails); // Pass the collected data back to the parent
    } else {
      console.log("Mobile number validation failed in modal.");
    }
  };

  return (
    <PaymentMethodModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Money Payment Details"
    >
      {/* REMOVED THE <form> TAG HERE */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2">
            Mobile Number*
          </label>
          <input
            {...inputProps("mobileNumber", register, trigger, true, {
              pattern: {
                value: /^\+?[1-9]\d{8,14}$/,
                message:
                  "Enter a valid phone number (9-15 digits, no leading zero)",
              },
            })}
            placeholder="e.g. +254712345678"
          />
          {errors?.mobileNumber && (
            <p className="text-red-500 text-xs mt-1">
              {errors.mobileNumber.message}
            </p>
          )}
        </div>
      </div>
      {/* Buttons now directly connected to handleSave via onClick */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          type="button" // IMPORTANT: Change back to type="button"
          onClick={handleSave} // Call handleSave directly
          className="px-4 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 bg-green-600 text-white hover:bg-green-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 mt-3 sm:mt-0 sm:ml-3"
        >
          Cancel
        </button>
      </div>
      {/* REMOVED THE </form> TAG HERE */}
    </PaymentMethodModal>
  );
};
