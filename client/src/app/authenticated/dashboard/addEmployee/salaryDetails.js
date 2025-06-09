import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { BankDetailsModal, MobileMoneyDetailsModal } from "./paymentMethod";


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
    setError,
  } = useFormContext();

  const selectedPaymentMethod = watch("paymentMethod");

  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);

  const [paymentDetailsCompleted, setPaymentDetailsCompleted] = useState({
    bank: false,
    mobileMoney: false,
  });

  const [prevPaymentMethod, setPrevPaymentMethod] = useState(null);


  const fallbackOptions = {
    paymentMethods: [
      { value: "bank", label: "Bank" },
      { value: "cash", label: "Cash" },
      { value: "cheque", label: "Cheque" },
      { value: "mobileMoney", label: "Mobile Money" },
    ],
    currencies: [
      { value: "KES", label: "KES" },
      // { value: 'USD', label: 'USD' },
      // { value: 'EUR', label: 'EUR' },
      // { value: 'GBP', label: 'GBP' }
    ],
  };

  useEffect(() => {
    setPaymentMethodOptions(fallbackOptions.paymentMethods);
    setCurrencyOptions(fallbackOptions.currencies);
    setLoading(false);
  }, []);

  useEffect(() => {
    const mode = watch("modeOfPayment");
    const amount = watch("amountPerRate");
    const units = watch("unitsWorked");

    // More robust number handling
    const safeAmount = isNaN(Number(amount)) ? 0 : Number(amount);
    const safeUnits = isNaN(Number(units)) ? 0 : Number(units);

    let calculatedSalary = 0;
    if (mode === "monthly") {
      calculatedSalary = Math.max(0, safeAmount);
    } else {
      calculatedSalary = Math.max(0, safeAmount * safeUnits);
    }

    setValue("basicSalary", parseFloat(calculatedSalary.toFixed(2)), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [
    watch("modeOfPayment"),
    watch("amountPerRate"),
    watch("unitsWorked"),
    setValue,
  ]);

  useEffect(() => {
    // Always register mobileNumber field (but only require it conditionally)
    register("mobileNumber");

    if (!selectedPaymentMethod) return; // Don't proceed if no payment method selected


    if (selectedPaymentMethod === "cash") {
      unregister([
        "bankName",
        "accountNumber",
        "bankCode",
        "branchName",
        "branchCode",
        "accountName",
        "paymentMethodDetails",
      ],{keepValue: false});

      clearErrors([
        "bankName",
        "accountNumber",
        "bankCode",
        "branchName",
        "branchCode",
        "accountName",
        "mobileNumber",
        "paymentMethodDetails",
      ]);

      setValue("mobileNumber", "");
      clearErrors("mobileNumber");


    } else if (
      selectedPaymentMethod === "bank" ||
      selectedPaymentMethod === "cheque"
    ) {

      // const isBankOrCheque = selectedPaymentMethod === "bank" || selectedPaymentMethod === "cheque";
      const bankValidation = {
        required: {
          value: true,
          message: `Field is required for ${selectedPaymentMethod} payments`
        }};
      
        register("bankName", bankValidation);
        register("accountNumber", bankValidation);
        register("bankCode", bankValidation);
        register("branchName", bankValidation);
        register("branchCode", bankValidation);
        register("accountName", bankValidation);

    

      // Clear mobile number validation
      setValue("mobileNumber", "");
      clearErrors("mobileNumber");


    } else if (selectedPaymentMethod === "mobileMoney") {
      // Unregister bank fields
      unregister([
        "bankName",
        "accountNumber",
        "bankCode",
        "branchName",
        "branchCode",
        "accountName",
      ], {keepValue: false});

    // Clear all bank-related errors
      clearErrors([
        "bankName",
        "accountNumber",
        "bankCode",
        "branchName",
        "branchCode",
        "accountName",
      ]);

      // Set mobileNumber as required
      setValue("mobileNumber", "", { shouldValidate: true });
    }
  }, [selectedPaymentMethod, register, unregister, clearErrors, setValue]);

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;

      // Clear all payment-related values and errors
      const paymentFields = [
         "bankName",
          "accountNumber",
          "bankCode",
          "branchName",
          "branchCode",
          "accountName",
          "mobileNumber",
          "paymentMethodDetails",
        ];

      paymentFields.forEach((field) => {
      setValue(field, "");
      });
      clearErrors(paymentFields);
    
    setValue("paymentMethod", method, { shouldValidate: false });

    // Reset payment details status
    setPaymentDetailsCompleted({
      bank: false,
      mobileMoney: false,
      });

    // Close any open modals
    // setIsBankModalOpen(false);
    // setIsMpesaModalOpen(false);

    

    // Handle specific payment method logic
    if (method === "bank" || method === "cheque") {
      setIsBankModalOpen(true);
    } else if (method === "mobileMoney") {
      setIsMpesaModalOpen(true);
    }


  // Manually trigger validation after a small delay
  setTimeout(() => {
    trigger();
  }, 100);
  };
  

  const handlePaymentDetailsComplete = (method) => {
    if (method === "bank") {
      setIsBankModalOpen(false);
      setPaymentDetailsCompleted((prev) => ({ ...prev, bank: true }));
    } else if (method === "mobileMoney") {
      setIsMpesaModalOpen(false);
      setPaymentDetailsCompleted((prev) => ({ ...prev, mobileMoney: true }));
    }

    // Trigger form validation
    setTimeout(() => {
      trigger();
    }, 200);
  };

  const handleEditBankDetails = () => {
    setIsBankModalOpen(true);
  };

  const handleEditMobileMoneyDetails = () => {
    setIsMpesaModalOpen(true);
  };

  const inputClass =
    "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black border-gray-200";
  const selectClass =
    "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white text-black border-gray-200";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Currency Selection */}
            <div className="relative">
              <select
                {...register("currency", { required: "Currency is required" })}
                className={selectClass}
                defaultValue="KES"
              >
                <option value="" disabled>
                  Currency
                </option>
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
              {errors?.currency && (
                <p className={errorClass}>{errors.currency.message}</p>
              )}
            </div>

            {/* Mode of Payment */}
            <div className="relative">
              <select
                {...register("modeOfPayment", {
                  required: "Mode of payment is required",
                })}
                className={selectClass}
                defaultValue="monthly"
              >
                <option value="" disabled>
                  Select Payment Mode
                </option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
              {errors?.modeOfPayment && (
                <p className={errorClass}>{errors.modeOfPayment.message}</p>
              )}
            </div>

            {/* Amount Per Rate */}
            <div className="relative">
              <input
                type="number"
                {...register("amountPerRate", {
                  required: "Amount per rate is required",
                  min: { value: 0, message: "Amount cannot be negative" },
                  valueAsNumber: true,
                })}
                placeholder="Amount per rate"
                className={inputClass}
                step="0.01"
              />
              {errors?.amountPerRate && (
                <p className={errorClass}>{errors.amountPerRate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Units Worked (conditionally shown) */}
        {watch("modeOfPayment") && watch("modeOfPayment") !== "monthly" && (
          <div className="relative">
            <input
              type="number"
              {...register("unitsWorked", {
                required:
                  watch("modeOfPayment") !== "monthly"
                    ? "Units worked is required for non-monthly payments"
                    : false,
                min: { value: 0, message: "Units cannot be negative" },
                valueAsNumber: true,
                validate: (value) => {
                  if (
                    watch("modeOfPayment") !== "monthly" &&
                    (value === null || value === undefined)
                  ) {
                    return "Units worked is required for this payment mode";
                  }
                  return true;
                },
              })}
            />
            {errors?.unitsWorked && (
              <p className={errorClass}>{errors.unitsWorked.message}</p>
            )}
          </div>
        )}

        {/* Hidden basic salary field */}
        <input type="hidden" {...register("basicSalary")} />

        {/* Calculated Basic Salary (Display Only) */}
        <div
          className={`relative ${
            watch("modeOfPayment") !== "monthly" ? "" : "md:col-span-2"
          }`}
        >
          <div
            className={`${inputClass} bg-gray-100 flex items-center text-gray-600`}
          >
            <span className="mr-1">Calculated Basic Salary:</span>
            <span className="font-medium ml-1">
              {watch("basicSalary")?.toLocaleString() || "0"}{" "}
              {watch("currency")}
            </span>
          </div>
          {errors?.basicSalary && (
            <p className={errorClass}>{errors.basicSalary.message}</p>
          )}
        </div>

        {/* Method of Payment */}
        <div className="relative">
          <select
            {...register("paymentMethod", {
              required: "Method of Payment is required",
            })}
            className={selectClass}
            onChange={handlePaymentMethodChange}
          >
            <option value="" disabled>
              Select Method of Payment
            </option>
            {paymentMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
          {errors?.paymentMethod && (
            <p className={errorClass}>{errors.paymentMethod.message}</p>
          )}
        </div>

        {/* Accumulated Leave Days */}
        <div className="relative">
          <input
            type="number"
            {...register("accumulatedLeaveDays", {
              required: "Accumulated Leave Days are required",
              min: { value: 0, message: "Days cannot be negative" },
              valueAsNumber: true,
            })}
            placeholder="Accumulated Leave Days"
            className={inputClass}
          />
          {errors?.accumulatedLeaveDays && (
            <p className={errorClass}>{errors.accumulatedLeaveDays.message}</p>
          )}
        </div>

        {/* Utilized Leave Days */}
        <div className="relative">
          <input
            type="number"
            {...register("utilizedLeaveDays", {
              required: "Utilized Leave Days are required",
              min: { value: 0, message: "Days cannot be negative" },
              valueAsNumber: true,
            })}
            placeholder="Utilized Leave Days"
            className={inputClass}
          />
          {errors?.utilizedLeaveDays && (
            <p className={errorClass}>{errors.utilizedLeaveDays.message}</p>
          )}
        </div>

        {/* Payment method details status - now full width */}
        {(selectedPaymentMethod === "bank" ||
          selectedPaymentMethod === "cheque") && (
          <div className="md:col-span-2">
            <div
              className={`p-2 rounded ${
                paymentDetailsCompleted.bank
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              } flex items-center`}
            >
              <svg
                className={`w-4 h-4 mr-2 ${
                  paymentDetailsCompleted.bank
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                {paymentDetailsCompleted.bank ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <div className="flex-grow">
                {paymentDetailsCompleted.bank
                  ? `Bank details have been provided (${getValues(
                      "bankName"
                    )} - ${getValues("accountNumber")})`
                  : "Please provide bank account details"}
              </div>
              <button
                type="button"
                onClick={handleEditBankDetails}
                className="ml-auto text-xs underline"
              >
                {paymentDetailsCompleted.bank ? "Edit Details" : "Add Details"}
              </button>
            </div>
          </div>
        )}

        {selectedPaymentMethod === "mobileMoney" && (
          <div className="md:col-span-2">
            <div
              className={`p-2 rounded ${
                paymentDetailsCompleted.mobileMoney
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              } flex items-center`}
            >
              <svg
                className={`w-4 h-4 mr-2 ${
                  paymentDetailsCompleted.mobileMoney
                    ? "text-green-500"
                    : "text-yellow-500"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                {paymentDetailsCompleted.mobileMoney ? (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <div className="flex-grow">
                {paymentDetailsCompleted.mobileMoney
                  ? `Mobile Money details have been provided (${getValues(
                      "mobileNumber"
                    )})`
                  : "Please provide Mobile Money details"}
              </div>
              <button
                type="button"
                onClick={handleEditMobileMoneyDetails}
                className="ml-auto text-xs underline"
              >
                {paymentDetailsCompleted.mobileMoney
                  ? "Edit Details"
                  : "Add Details"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Modals */}
      <BankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSave={() => handlePaymentDetailsComplete("bank")}
        errors={errors}
      />

      <MobileMoneyDetailsModal
        isOpen={isMpesaModalOpen}
        onClose={() => setIsMpesaModalOpen(false)}
        onSave={() => handlePaymentDetailsComplete("mobileMoney")}
        errors={errors}
      />
    </>
  );
};

export default SalaryDetailsForm;