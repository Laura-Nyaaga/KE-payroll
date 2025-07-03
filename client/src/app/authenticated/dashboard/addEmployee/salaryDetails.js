// SalaryDetailsForm.jsx (your main component)
'use client';
import React, { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { BankDetailsModal, MobileMoneyDetailsModal } from "./paymentMethod"; // Ensure this path is correct
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api, { BASE_URL } from '../../../config/api';

const SalaryDetailsForm = () => {
  const {
    register,
    unregister,
    formState: { errors },
    getValues,
    setValue,
    trigger,
    clearErrors,
    watch,
    control,
  } = useFormContext();

  const selectedPaymentMethod = watch("paymentMethod") || "";
  const modeOfPayment = watch("modeOfPayment") || "";

  // Watch individual payment detail fields to determine their fill status
  const bankName = watch("bankName");
  const accountNumber = watch("accountNumber");
  const mobileNumber = watch("mobileNumber");

  const companyId = localStorage.getItem('companyId');

  const [companyCurrency, setCompanyCurrency] = useState('KES');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);

  // Payment method options (static)
  const paymentMethodOptions = [
    { value: "bank", label: "Bank" },
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "mobileMoney", label: "Mobile Money" },
  ];

  // Helper to determine if bank details are sufficiently filled
  const areBankDetailsFilled = useCallback(() => {
      const currentBankName = getValues("bankName");
      const currentAccountNumber = getValues("accountNumber");
      const currentAccountName = getValues("accountName");
      return !!currentBankName && !!currentAccountNumber && !!currentAccountName;
  }, [getValues]);

  // Helper to determine if mobile money details are sufficiently filled
  const areMobileMoneyDetailsFilled = useCallback(() => {
      const currentMobileNumber = getValues("mobileNumber");
      return !!currentMobileNumber;
  }, [getValues]);

  // Derive status message for UI
  const paymentDetailsStatusMessage = useCallback(() => {
    if (selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque") {
      return areBankDetailsFilled()
        ? `Bank details provided (${getValues("bankName")} - ${getValues("accountNumber")})`
        : "Please provide bank account details";
    } else if (selectedPaymentMethod === "mobileMoney") {
      return areMobileMoneyDetailsFilled()
        ? `Mobile Money details provided (${getValues("mobileNumber")})`
        : "Please provide Mobile Money details";
    }
    return ""; // For cash or no selection
  }, [selectedPaymentMethod, areBankDetailsFilled, areMobileMoneyDetailsFilled, getValues]);


  // --- Initializing form values on first render (for select elements) ---
  useEffect(() => {
    // This ensures selects bind correctly to "" if no default value is loaded from RHF
    if (getValues("modeOfPayment") === undefined) {
      setValue("modeOfPayment", "", { shouldValidate: false, shouldDirty: false });
    }
    if (getValues("paymentMethod") === undefined) {
      setValue("paymentMethod", "", { shouldValidate: false, shouldDirty: false });
    }
    // These should not be set to empty string initially if they are expected to hold objects or null
    // setValue("paymentMethodDetails", "", { shouldValidate: false, shouldDirty: false });
  }, [setValue, getValues]);


  // Fetch company currency
  useEffect(() => {
    const fetchCompanyCurrency = async () => {
      try {
        const response = await api.get(`${BASE_URL}/companies/${companyId}`);
        const currency = response.data.currency || 'KES';
        setCompanyCurrency(currency);
        setValue('currency', currency, { shouldValidate: true });
      } catch (err) {
        toast.error('Failed to fetch company currency');
        console.error('Error fetching currency:', err);
        setCompanyCurrency('KES');
        setValue('currency', 'KES', { shouldValidate: true });
      }
    };

    if (companyId) fetchCompanyCurrency();
  }, [companyId, setValue]);

  // Calculate basic salary
  useEffect(() => {
    const amount = watch("amountPerRate");
    const units = watch("unitsWorked");

    const safeAmount = isNaN(Number(amount)) ? 0 : Number(amount);
    const safeUnits = isNaN(Number(units)) ? 0 : Number(units);

    let calculatedSalary = modeOfPayment === "monthly"
      ? Math.max(0, safeAmount)
      : Math.max(0, safeAmount * safeUnits);

    setValue("basicSalary", parseFloat(calculatedSalary.toFixed(2)), {
      shouldValidate: true,
    });
  }, [modeOfPayment, watch("amountPerRate"), watch("unitsWorked"), setValue]);

  // Handle conditional registration and validation based on payment method
  useEffect(() => {
    const bankFields = ["bankName", "accountNumber", "bankCode", "branchName", "branchCode", "accountName", "accountName"];
    const mobileMoneyField = "mobileNumber";

    // Unregister all potentially conflicting fields first
    unregister([...bankFields, mobileMoneyField]);
    clearErrors([...bankFields, mobileMoneyField]); // Clear errors associated with them

    // Conditionally register and apply validation rules for the active method
    if (selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque") {
      register("bankName", { required: "Bank Name is required." });
      register("accountNumber", { required: "Account Number is required." });
      register("accountName", { required: "Account Name is required." });
      register("bankCode");
      register("branchName");
      register("branchCode");
    } else if (selectedPaymentMethod === "mobileMoney") {
      register("mobileNumber", {
        required: "Mobile Number is required.",
        pattern: {
            value: /^[0-9]{10,15}$/,
            message: "Invalid mobile number format (10-15 digits)."
        }
      });
    }

    // `paymentMethodDetails` field (hidden) should be used as a "status" or a marker.
    // It is effectively required if selectedPaymentMethod is not "cash".
    // We can directly set its value based on whether the specific details are filled.
    if (selectedPaymentMethod === "cash") {
        setValue("paymentMethodDetails", "N/A", { shouldValidate: true });
    } else if (selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque") {
        setValue("paymentMethodDetails", areBankDetailsFilled() ? "valid" : "", { shouldValidate: true });
    } else if (selectedPaymentMethod === "mobileMoney") {
        setValue("paymentMethodDetails", areMobileMoneyDetailsFilled() ? "valid" : "", { shouldValidate: true });
    } else { // No method selected
        setValue("paymentMethodDetails", "", { shouldValidate: true });
    }

    // Trigger validation for paymentMethodDetails and relevant individual fields
    trigger("paymentMethodDetails");
    if (selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque") {
        trigger(bankFields);
    } else if (selectedPaymentMethod === "mobileMoney") {
        trigger(mobileMoneyField);
    }

  }, [selectedPaymentMethod, register, unregister, clearErrors, setValue, trigger, areBankDetailsFilled, areMobileMoneyDetailsFilled]);


  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;

    // IMPORTANT: Clear all *relevant* payment detail values from RHF state
    // when the payment method is changed. This prevents old data from lingering.
    setValue("bankName", "", { shouldValidate: false });
    setValue("accountNumber", "", { shouldValidate: false });
    setValue("bankCode", "", { shouldValidate: false });
    setValue("branchName", "", { shouldValidate: false });
    setValue("branchCode", "", { shouldValidate: false });
    setValue("accountName", "", { shouldValidate: false });
    setValue("mobileNumber", "", { shouldValidate: false });
    setValue("paymentMethodDetails", "", { shouldValidate: false }); // Reset this status field

    clearErrors([
      "bankName", "accountNumber", "bankCode", "branchName",
      "branchCode", "accountName", "mobileNumber", "paymentMethodDetails",
    ]);

    setValue("paymentMethod", method, { shouldValidate: true });

    // Open appropriate modal if needed
    if (method === "bank" || method === "cheque") {
      setIsBankModalOpen(true);
      setIsMpesaModalOpen(false);
    } else if (method === "mobileMoney") {
      setIsMpesaModalOpen(true);
      setIsBankModalOpen(false);
    } else { // For 'cash' or empty selection
      setIsBankModalOpen(false);
      setIsMpesaModalOpen(false);
    }
    // After changing method, immediately re-trigger validation for paymentMethodDetails
    // so the UI status updates.
    trigger("paymentMethodDetails");
  };

  // NEW: Callback when bank details are saved from the modal
  const handleSaveBankDetails = (details) => {
    // Set all bank detail fields into RHF state
    setValue("bankName", details.bankName, { shouldValidate: true });
    setValue("accountNumber", details.accountNumber, { shouldValidate: true });
    setValue("bankCode", details.bankCode, { shouldValidate: true });
    setValue("branchName", details.branchName, { shouldValidate: true });
    setValue("branchCode", details.branchCode, { shouldValidate: true });
    setValue("accountName", details.accountName, { shouldValidate: true });

    // Mark paymentMethodDetails as valid (or set a specific value)
    setValue("paymentMethodDetails", "valid", { shouldValidate: true }); // A string "valid" or similar
    
    // Trigger validation for all newly set fields
    trigger([
      "bankName", "accountNumber", "bankCode", "branchName",
      "branchCode", "accountName", "paymentMethodDetails"
    ]);

    setIsBankModalOpen(false); // Close the modal
    toast.success("Bank details saved!");
  };

  // NEW: Callback when mobile money details are saved from the modal
  const handleSaveMobileMoneyDetails = (details) => {
    // Set mobile number field into RHF state
    setValue("mobileNumber", details.mobileNumber, { shouldValidate: true });

    // Mark paymentMethodDetails as valid (or set a specific value)
    setValue("paymentMethodDetails", "valid", { shouldValidate: true }); // A string "valid" or similar
    
    // Trigger validation for newly set fields
    trigger(["mobileNumber", "paymentMethodDetails"]);

    setIsMpesaModalOpen(false); // Close the modal
    toast.success("Mobile Money details saved!");
  };

  // Common field props (unchanged from HRDetailsForm, now with onChange for setValue)
  const inputProps = (name, required = false, pattern = null) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(' ')} is required`,
      pattern,
      onBlur: () => trigger(name)
    }),
    className: "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    onChange: (e) => { // ADD THIS
        setValue(name, e.target.value, { shouldValidate: true });
        trigger(name);
    }
  });

  const selectProps = (name, required = false) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(' ')} is required`,
      onBlur: () => trigger(name)
    }),
    className: "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    onChange: (e) => { // ADD THIS
        setValue(name, e.target.value, { shouldValidate: true });
        trigger(name);
    }
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Currency (Display Only) */}
          <div>
            <label className="block text-sm font-semibold mb-2">Currency*</label>
            <div className="w-full border p-3 rounded-lg shadow-sm bg-gray-100 flex items-center text-gray-600">
              <span className="font-medium">{companyCurrency}</span>
            </div>
            <input type="hidden" {...register("currency")} />
          </div>

          {/* Mode of Payment */}
          <div>
            <label className="block text-sm font-semibold mb-2">Mode of Payment*</label>
            <select {...selectProps("modeOfPayment", true)}>
              <option value="">Select Payment Mode</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="hourly">Hourly</option>
            </select>
            {errors?.modeOfPayment && <p className="text-red-500 text-xs mt-1">{errors.modeOfPayment.message}</p>}
          </div>

          {/* Amount Per Rate */}
          <div>
            <label className="block text-sm font-semibold mb-2">Amount Per Rate*</label>
            <input
              type="number"
              {...inputProps("amountPerRate", true, {
                pattern: {
                    value: /^(0|[1-9]\d*)(\.\d+)?$/,
                    message: "Amount must be a positive number."
                }
              })}
              placeholder="e.g. 30000, 1500, 100"
              step="0.01"
            />
            {errors?.amountPerRate && <p className="text-red-500 text-xs mt-1">{errors.amountPerRate.message}</p>}
          </div>

          {/* Units Worked */}
          {modeOfPayment !== "monthly" && (
            <div>
              <label className="block text-sm font-semibold mb-2">Units Worked*</label>
              <input
                type="number"
                {...inputProps("unitsWorked", true, {
                  pattern: {
                    value: /^(0|[1-9]\d*)(\.\d+)?$/,
                    message: "Units must be a positive number."
                  }
                })}
                placeholder="e.g. 1, 20, 100"
                step="0.01"
              />
              {errors?.unitsWorked && <p className="text-red-500 text-xs mt-1">{errors.unitsWorked.message}</p>}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold mb-2">Method of Payment*</label>
            <select
              {...selectProps("paymentMethod", true)}
              onChange={handlePaymentMethodChange}
            >
              <option value="">Select Method</option>
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors?.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
          </div>

          {/* Leave Days */}
          <div>
            <label className="block text-sm font-semibold mb-2">Accumulated Leave Days</label>
            <input
              type="number"
              {...inputProps("accumulatedLeaveDays", false, {
                min: { value: 0, message: "Days cannot be negative" }
              })}
              placeholder="Accumulated Leave Days"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Utilized Leave Days</label>
            <input
              type="number"
              {...inputProps("utilizedLeaveDays", false, {
                min: { value: 0, message: "Days cannot be negative" }
              })}
              placeholder="Utilized Leave Days"
            />
          </div>

          {/* Basic Salary Display */}
          <div>
            <label className="block text-sm font-semibold mb-2">Calculated Basic Salary</label>
            <div className="w-full border p-3 rounded-lg shadow-sm bg-gray-100 flex items-center text-gray-600">
              <span className="mr-1">Salary:</span>
              <span className="font-medium ml-1">
                {watch("basicSalary")?.toLocaleString() || "0"} {companyCurrency}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Details Status/Button */}
        {(selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque") && (
          <div className="md:col-span-2">
            <div className={`p-3 rounded flex items-center ${
              areBankDetailsFilled() // Use the new helper function
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}>
              <div className="flex-grow">
                {paymentDetailsStatusMessage()} {/* Use the new message function */}
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="ml-auto text-sm underline hover:text-green-600"
              >
                {areBankDetailsFilled() ? "Edit Details" : "Add Details"}
              </button>
            </div>
            {errors.paymentMethodDetails && <p className="text-red-500 text-xs mt-1">{errors.paymentMethodDetails.message}</p>}
          </div>
        )}

        {selectedPaymentMethod === "mobileMoney" && (
          <div className="md:col-span-2">
            <div className={`p-3 rounded flex items-center ${
              areMobileMoneyDetailsFilled() // Use the new helper function
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}>
              <div className="flex-grow">
                {paymentDetailsStatusMessage()} {/* Use the new message function */}
              </div>
              <button
                type="button"
                onClick={() => setIsMpesaModalOpen(true)}
                className="ml-auto text-sm underline hover:text-green-600"
              >
                {areMobileMoneyDetailsFilled() ? "Edit Details" : "Add Details"}
              </button>
            </div>
             {errors.paymentMethodDetails && <p className="text-red-500 text-xs mt-1">{errors.paymentMethodDetails.message}</p>}
          </div>
        )}
      </div>

      {/* Keep these hidden inputs registered, as their values are managed via setValue */}
      <input type="hidden" {...register("basicSalary")} />
      <input type="hidden" {...register("paymentMethodDetails")} />
      
      {/* Individual fields that the modal will fill. Register them here so they are part of the form state. */}
      {/* This is important for the `getValues` in `areBankDetailsFilled` and `areMobileMoneyDetailsFilled` to work */}
      <input type="hidden" {...register("bankName")} />
      <input type="hidden" {...register("accountNumber")} />
      <input type="hidden" {...register("bankCode")} />
      <input type="hidden" {...register("branchName")} />
      <input type="hidden" {...register("branchCode")} />
      <input type="hidden" {...register("accountName")} />
      <input type="hidden" {...register("mobileNumber")} />


      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => {
            setIsBankModalOpen(false);
            // Re-trigger validation for paymentMethodDetails if modal is closed without saving
            // This ensures the required status updates correctly if user cancels without filling
            trigger("paymentMethodDetails");
        }}
        // Pass the new save handler that receives data
        onSave={handleSaveBankDetails}
        // Pass current RHF values to pre-fill the modal
        initialData={{
          bankName: getValues("bankName"),
          accountNumber: getValues("accountNumber"),
          bankCode: getValues("bankCode"),
          branchName: getValues("branchName"),
          branchCode: getValues("branchCode"),
          accountName: getValues("accountName"),
        }}
      />

      <MobileMoneyDetailsModal
        isOpen={isMpesaModalOpen}
        onClose={() => {
            setIsMpesaModalOpen(false);
            trigger("paymentMethodDetails");
        }}
        // Pass the new save handler that receives data
        onSave={handleSaveMobileMoneyDetails}
        // Pass current RHF values to pre-fill the modal
        initialData={{
          mobileNumber: getValues("mobileNumber"),
        }}
      />
    </div>
  );
};

export default SalaryDetailsForm;