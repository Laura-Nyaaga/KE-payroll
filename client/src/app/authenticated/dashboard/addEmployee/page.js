"use client";
import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect, useCallback, useRef } from "react";
import PersonalDetailsForm from "./personalDetails";

import HRDetailsForm from "./hrDetails";
import SalaryDetailsForm from "./salaryDetails";
import TaxDetailsForm from "./taxDetails";
import TabNavigation from "./tabNavigation";
import ContactsDetailsForm from "./contactDetails";
import { useRouter } from "next/navigation";
import api, { BASE_URL } from "../../../config/api"; 
import AdditionalDetailsForm from "./additionalDetails";

export default function AddEmployee() {
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState({
    personalDetails: {},
    hrDetails: {},
    salaryDetails: {},
    contactsDetails: {},
    taxDetails: {},
    additionalDetails: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const methods = useForm({
    mode: "onChange",
    reValidateMode: "onBlur",
    defaultValues: {
      // Personal Details
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "",
      dob: "",
      nationalId: "",
      passportNo: "",
      maritalStatus: "",
      residentialStatus: "",
      workEmail: "",
      passportPhoto: "",

      // HR Details
      staffNo: "",
      jobTitleId: "", 
      employmentType: "", 
      employmentDate: "",
      departmentId: "", 
      projectId: null,
      reportingToId: null,
      endDate: "",

      // Salary Details
      currency: "", 
      amountPerRate: "",
      modeOfPayment: "", 
      unitsWorked: "",
      paymentMethod: "", 
      bankName: "",
      accountNumber: "",
      bankCode: "",
      branchName: "",
      branchCode: "",
      accountName: "",
      mobileNumber: "",
      paymentMethodDetails: "",
      accumulatedLeaveDays: 0,
      utilizedLeaveDays: 0,
      basicSalary: 0,

      // Contacts Details
      personalEmail: "",
      workPhone: "",
      personalPhone: "",
      physicalAddress: "",

      // Tax Details
      kraPin: "",
      nhifNo: "",
      nssfNo: "",
      shaNo: "",
      // taxExemption: "",

      // Additional Details
      earnings: [],
      deductions: [],
    },
  });
  const {
    formState: { isValid, errors },
    trigger,
    getValues,
    watch,
    reset,
  } = methods;

  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const tabs = [
    {
      name: "Personal Details",
      component: PersonalDetailsForm,
      key: "personalDetails",
      requiredFields: [
        "firstName",
        "lastName",
        "gender",
        "dob",
        "workEmail",
        "maritalStatus",
        "residentialStatus",
      ],
    },
    {
      name: "HR Details",
      component: HRDetailsForm,
      key: "hrDetails",
      requiredFields: [
        "staffNo",
        "jobTitleId",
        "employmentType",
        "employmentDate",
        "departmentId",
      ],
    },
    {
      name: "Salary Details",
      component: SalaryDetailsForm,
      key: "salaryDetails",
      requiredFields: [
        "currency",
        "amountPerRate",
        "modeOfPayment",
        "paymentMethod",
        "accumulatedLeaveDays",
        "utilizedLeaveDays",
      ],
    },
    {
      name: "Contacts Details",
      component: ContactsDetailsForm,
      key: "contactsDetails",
      requiredFields: ["physicalAddress"],
    },
    {
      name: "Tax Details",
      component: TaxDetailsForm,
      key: "taxDetails",
      requiredFields: ["kraPin", "nssfNo", "shaNo"],
    },
    {
      name: "Additional Details",
      component: AdditionalDetailsForm,
      key: "additionalDetails",
      requiredFields: [],
    },
  ];

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Memoize the dynamic required fields calculation
  const getDynamicRequiredFields = useCallback(() => {
    const currentTab = tabs[activeTabIndex];
    if (!currentTab) return [];

    let fields = [...currentTab.requiredFields];
    const selectedPaymentMethod = getValues("paymentMethod");
    const modeOfPayment = getValues("modeOfPayment");

    if (currentTab.key === "salaryDetails") {
      if (modeOfPayment && modeOfPayment !== "monthly") {
        fields.push("unitsWorked");
      }

      if (
        selectedPaymentMethod === "bank" ||
        selectedPaymentMethod === "cheque" ||
        selectedPaymentMethod === "mobileMoney"
      ) {
        fields.push("paymentMethodDetails");
      }

      if (
        selectedPaymentMethod === "bank" ||
        selectedPaymentMethod === "cheque"
      ) {
        fields.push(
          "bankName",
          "accountNumber",
          "bankCode",
          "branchName",
          "branchCode",
          "accountName"
        );
      } else if (selectedPaymentMethod === "mobileMoney") {
        fields.push("mobileNumber");
      }
    }
    return [...new Set(fields)];
  }, [activeTabIndex, getValues, tabs]);

  const [isCurrentTabValid, setIsCurrentTabValid] = useState(false);

  useEffect(() => {
    // This effect runs whenever `errors` or dynamic fields change.
    // Also, when the active tab changes, we want to re-evaluate current tab validity.
    const updateTabValidity = () => {
      const requiredFields = getDynamicRequiredFields();
      let tabIsValid = true;

      // Debugging logs:
      // console.log(`--- Checking validity for tab: ${tabs[activeTabIndex]?.name} ---`);
      // console.log("Required fields:", requiredFields);
      // console.log("Current errors object:", errors);

      for (const field of requiredFields) {
        const fieldState = methods.getFieldState(field, methods.formState);
        if (fieldState.invalid) {
          // console.log(`Field '${field}' is invalid. Error:`, errors[field]);
          tabIsValid = false;
          break;
        }
      }
      // console.log("Is current tab valid (calculated):", tabIsValid);
      setIsCurrentTabValid(tabIsValid);
    };

    // `watch` is called with a callback that runs on every re-render or form state change.
    // This efficiently tracks the validity of fields.
    const subscription = watch(updateTabValidity);

    // Call it once on mount/tab change to set initial validity
    updateTabValidity();

    return () => subscription.unsubscribe();
  }, [watch, getDynamicRequiredFields, errors, methods, activeTabIndex, tabs]); // Add activeTabIndex and tabs for robust re-evaluation

  const handleFinalSubmit = methods.handleSubmit(
    async (data) => {
      if (activeTabIndex !== tabs.length - 1) {
        console.log("handleFinalSubmit blocked: Not on Additional Details tab");
        return;
      }
      // This console.log will ONLY fire if react-hook-form's internal validation passes
      console.log(
        "handleFinalSubmit called and form is globally valid by RHF!"
      );
      console.log("Final form data:", data); // `data` here is the entire validated form data

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // At this point, react-hook-form has already validated everything.
        // We can use the `data` object directly provided by `handleSubmit`.

        const completeData = {
          ...employeeData, // Use the employeeData that was accumulated on 'Continue'/'Tab Change'
          // However, `data` from handleSubmit might be more up-to-date if any changes happened on the last tab
          // Let's merge `data` into `employeeData` for a comprehensive final object.
          ...data, // This will override previous tab data with the final state from RHF
          companyId: localStorage.getItem("companyId"),
          createdByUserId: localStorage.getItem("createdByUserId"),
        };

        const flattenedData = flattenEmployeeData(completeData);

        const earningsToProcess = flattenedData.earnings;
        const deductionsToProcess = flattenedData.deductions;

        if (earningsToProcess && earningsToProcess.length > 0) {
  // Process earnings
          }
        if (deductionsToProcess && deductionsToProcess.length > 0) {
  // Process deductions
     }

        const employeePayload = Object.fromEntries(
          Object.entries(flattenedData).filter(
            ([key]) => key !== "earnings" && key !== "deductions"
          )
        );

        console.log("Employee Payload for API:", employeePayload);
        // 1. Create the employee
        const response = await api.post(
          `${BASE_URL}/employees`,
          employeePayload
        );
        const employeeId = response.data.id;
        console.log("Employee created with ID:", employeeId);

        // 2. Process earnings assignments
        if (earningsToProcess && earningsToProcess.length > 0) {
          const earningsAssignments = earningsToProcess.map((item) => ({
            employeeId,
            earningsId: item.id,
            effectiveDate: item.effectiveDate,
            endDate: item.endDate || null,
            ...(item.calculationMethod === "percentage" && {
              customPercentage: parseFloat(item.details.customPercentage),
            }),
            ...(item.calculationMethod === "fixed_amount" && {
              ...(item.mode === "monthly" && {
                customMonthlyAmount: parseFloat(
                  item.details.customMonthlyAmount
                ),
              }),
              ...(item.mode === "hourly" && {
                customNumberOfHours: parseFloat(
                  item.details.customNumberOfHours
                ),
                customHourlyRate: parseFloat(item.details.customHourlyRate),
              }),
              ...(item.mode === "daily" && {
                customNumberOfDays: parseFloat(item.details.customNumberOfDays),
                customDailyRate: parseFloat(item.details.customDailyRate),
              }),
              ...(item.mode === "weekly" && {
                customNumberOfWeeks: parseFloat(
                  item.details.customNumberOfWeeks
                ),
                customWeeklyRate: parseFloat(item.details.customWeeklyRate),
              }),
              ...(item.mode !== "monthly" &&
                item.mode !== "hourly" &&
                item.mode !== "daily" &&
                item.mode !== "weekly" && {
                  customMonthlyAmount: parseFloat(
                    item.details.customMonthlyAmount
                  ),
                }),
            }),
          }));
          console.log("Earnings Assignments:", earningsAssignments);
          await Promise.all(
            earningsAssignments.map((assignment) =>
              api.post(`${BASE_URL}/earnings/assign`, assignment)
            )
          );
          console.log("Earnings assignments processed.");
        }

        // 3. Process deductions assignments
        if (deductionsToProcess && deductionsToProcess.length > 0) {
          const deductionsAssignments = deductionsToProcess.map((item) => ({
            employeeId,
            deductionId: item.id,
            effectiveDate: item.effectiveDate,
            endDate: item.endDate || null,
            ...(item.calculationMethod === "percentage" && {
              customPercentage: parseFloat(item.details.customPercentage),
            }),
            ...(item.calculationMethod === "fixed_amount" && {
              ...(item.mode === "monthly" && {
                customMonthlyAmount: parseFloat(
                  item.details.customMonthlyAmount
                ),
              }),
              ...(item.mode === "hourly" && {
                customNumberOfHours: parseFloat(
                  item.details.customNumberOfHours
                ),
                customHourlyRate: parseFloat(item.details.customHourlyRate),
              }),
              ...(item.mode === "daily" && {
                customNumberOfDays: parseFloat(item.details.customNumberOfDays),
                customDailyRate: parseFloat(item.details.customDailyRate),
              }),
              ...(item.mode === "weekly" && {
                customNumberOfWeeks: parseFloat(
                  item.details.customNumberOfWeeks
                ),
                customWeeklyRate: parseFloat(item.details.customWeeklyRate),
              }),
              ...(item.mode !== "monthly" &&
                item.mode !== "hourly" &&
                item.mode !== "daily" &&
                item.mode !== "weekly" && {
                  customMonthlyAmount: parseFloat(
                    item.details.customMonthlyAmount
                  ),
                }),
            }),
          }));
          console.log("Deductions Assignments:", deductionsAssignments);
          await Promise.all(
            deductionsAssignments.map((assignment) =>
              api.post(`${BASE_URL}/deductions/assign`, assignment)
            )
          );
          console.log("Deductions assignments processed.");
        }

        // Clear local storage items after successful submission
        [
          "personalDetailsForm",
          "hrDetailsForm",
          "salaryDetailsForm",
          "contactsDetailsForm",
          "taxDetailsForm",
          "additionalDetailsForm",
        ].forEach((key) => {
          localStorage.removeItem(key);
        });

        setSuccess("Employee added successfully with all assignments!");
        setTimeout(() => {
          router.push("/authenticated/dashboard/list");
        }, 1000);
      } catch (err) {
        console.error("Submission error:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to submit employee data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    (errors) => {
      // This callback fires if react-hook-form's internal validation FAILS
      console.log("handleFinalSubmit not called. RHF found errors:", errors);
      const allFieldsToValidate = []; // Recalculate all required fields to give a better error message
      tabs.forEach((tab) => {
        allFieldsToValidate.push(...tab.requiredFields);
        if (tab.key === "salaryDetails") {
          const salaryDetailsData = getValues();
          if (
            salaryDetailsData.modeOfPayment &&
            salaryDetailsData.modeOfPayment !== "monthly"
          ) {
            allFieldsToValidate.push("unitsWorked");
          }
          if (
            salaryDetailsData.paymentMethod === "bank" ||
            salaryDetailsData.paymentMethod === "cheque" ||
            salaryDetailsData.paymentMethod === "mobileMoney"
          ) {
            allFieldsToValidate.push("paymentMethodDetails");
          }
          if (
            salaryDetailsData.paymentMethod === "bank" ||
            salaryDetailsData.paymentMethod === "cheque"
          ) {
            allFieldsToValidate.push(
              "bankName",
              "accountNumber",
              "bankCode",
              "branchName",
              "branchCode",
              "accountName"
            );
          } else if (salaryDetailsData.paymentMethod === "mobileMoney") {
            allFieldsToValidate.push("mobileNumber");
          }
        }
      });
      // Filter out duplicates
      const uniqueRequiredFields = [...new Set(allFieldsToValidate)];

      const errorMessages = Object.keys(errors)
        .filter((field) => uniqueRequiredFields.includes(field)) // Only show errors for required fields
        .map(
          (field) =>
            errors[field]?.message ||
            `${field.split(/(?=[A-Z])/).join(" ")} is invalid or missing.`
        )
        .filter(Boolean)
        .join(", ");

      setError(
        `Please fix these issues across all tabs before submitting: ${
          errorMessages || "Some required fields are missing or invalid."
        }`
      );
      setLoading(false);
    }
  );

  const handleContinue = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const requiredFields = getDynamicRequiredFields();
      const isTabValid = await trigger(requiredFields); // Trigger validation for current tab's required fields

      if (!isTabValid) {
        const errorMessages = requiredFields
          .map((field) => errors[field]?.message)
          .filter(Boolean)
          .join(", ");

        setError(
          errorMessages ||
            "Please complete all required fields for this section."
        );
        setLoading(false);
        return;
      }

      // Save current tab data
      const currentTab = tabs[activeTabIndex];
      const sectionKey = currentTab.key;
      const formValues = getValues(); // Get all current form values

      setEmployeeData((prev) => ({
        ...prev,
        [sectionKey]: formValues,
      }));

      // Move to next tab
      setActiveTabIndex((prev) => prev + 1);
      setSuccess(`${currentTab.name} saved successfully!`);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeTabIndex > 0) {
      const allFormData = getValues(); // Get current form values before going back
      setEmployeeData((prev) => ({
        ...prev,
        [tabs[activeTabIndex].key]: allFormData,
      })); // Save current tab's data
      setActiveTabIndex(activeTabIndex - 1);
      setError(null); // Clear errors when navigating back
      setSuccess(null); // Clear success messages
    }
  };

  // Optimized tab change handling
  const handleTabChange = async (index) => {
    if (index === activeTabIndex) return;

    setLoading(true);
    setError(null);

    try {
      const requiredFields = getDynamicRequiredFields();
      // Validate current tab before switching
      const isTabValid = await trigger(requiredFields);

      if (!isTabValid) {
        const errorMessages = requiredFields
          .map((field) => errors[field]?.message)
          .filter(Boolean)
          .join(", ");

        setError(
          errorMessages ||
            "Please complete all required fields before switching tabs."
        );
        setLoading(false);
        return;
      }

      // If current tab is valid, save its data
      const currentTab = tabs[activeTabIndex];
      const formValues = getValues();

      setEmployeeData((prev) => ({
        ...prev,
        [currentTab.key]: formValues,
      }));

      setActiveTabIndex(index);
      setSuccess(`Switched to ${tabs[index].name}`);
    } catch (err) {
      console.error("Tab change error:", err);
      setError("Failed to switch tabs");
    } finally {
      setLoading(false);
    }
  };

  const initializedTab = useRef(null);

  // Load saved data when tab changes (after setActiveTabIndex updates)
  useEffect(() => {
    const currentTabKey = tabs[activeTabIndex]?.key;

    if (initializedTab.current !== currentTabKey) {
      const currentTab = tabs[activeTabIndex];
      if (
        currentTab &&
        employeeData[currentTab.key] &&
        Object.keys(employeeData[currentTab.key]).length > 0
      ) {
        // Only reset if there's actual data for this tab in employeeData
        const dataToReset = employeeData[currentTab.key];

        // Check if current form values are different from saved data to prevent unnecessary resets
        // This is a shallow comparison; for deep comparisons, you might need a utility like `lodash.isEqual`
        // but for simple cases, stringifying works.
        if (
          JSON.stringify(getValues(currentTab.key)) !==
          JSON.stringify(dataToReset)
        ) {
          reset(dataToReset);
          // console.log(`Resetting form for tab '${currentTab.name}' with saved data.`);
        }
      } else {
        // If no data for this tab, or it's empty, reset to default form values
        // Use currentTab.key to isolate defaults for the current tab if possible
        // Otherwise, reset to the full set of default values
        // console.log(`Resetting form for tab '${currentTab.name}' to default values.`);
        reset(methods.formState.defaultValues);
      }

      // After reset, trigger validation for the new tab's fields
      // This ensures the `isCurrentTabValid` state updates correctly after loading data.
      const fieldsToTrigger = getDynamicRequiredFields();
      trigger(fieldsToTrigger);
      // console.log(`Triggered validation for fields:`, fieldsToTrigger);

      initializedTab.current = currentTabKey;
    }
  }, [
    activeTabIndex,
    reset,
    employeeData,
    getDynamicRequiredFields,
    trigger,
    methods.formState.defaultValues,
    getValues,
    tabs,
  ]);

  // Helper function to flatten the data structure
  const flattenEmployeeData = (data) => {
    let basicSalary = 0;
    if (data.salaryDetails.modeOfPayment === "monthly") {
      basicSalary = parseFloat(data.salaryDetails.amountPerRate) || 0;
    } else {
      basicSalary =
        parseFloat(data.salaryDetails.amountPerRate) *
        parseFloat(data.salaryDetails.unitsWorked);
    }
    basicSalary = parseFloat(basicSalary.toFixed(2));
    console.log("Calculated basic salary:", basicSalary);

    const paymentMethod = data.salaryDetails.paymentMethod;

    // Destructure properties safely, providing defaults for optional fields
    // Using `?.` for optional chaining on nested objects if they might be undefined
    const personalDetails = data.personalDetails || {};
    const hrDetails = data.hrDetails || {};
    const salaryDetails = data.salaryDetails || {};
    const taxDetails = data.taxDetails || {};
    const contactsDetails = data.contactsDetails || {};
    const additionalDetails = data.additionalDetails || {};

    const {
      firstName,
      middleName = "",
      lastName,
      gender,
      dob,
      nationalId,
      passportNo = "",
      maritalStatus,
      residentialStatus,
      workEmail,
      passportPhoto = "",
    } = personalDetails;

    const {
      staffNo,
      jobTitleId,
      employmentType,
      employmentDate,
      departmentId,
      projectId = null,
      reportingToId = null,
      endDate = null,
    } = hrDetails;

    const {
      currency,
      amountPerRate,
      modeOfPayment,
      paymentMethod: salaryPaymentMethod,
      accountNumber,
      bankName,
      bankCode,
      branchName,
      branchCode,
      accountName,
      mobileNumber,
      unitsWorked,
      accumulatedLeaveDays = 0,
      utilizedLeaveDays = 0,
      basicSalary: initialBasicSalary, // Preserve existing basicSalary if any, though it's recalculated
    } = salaryDetails;

    const { kraPin, nhifNo, nssfNo, shaNo} = taxDetails;

    const {
      personalEmail = null,
      workPhone,
      personalPhone = null,
      physicalAddress,
    } = contactsDetails;

    const { earnings = [], deductions = [] } = additionalDetails;

    return {
      // Personal details
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth: dob,
      nationalId,
      passportNo,
      maritalStatus,
      residentialStatus,
      workEmail,
      passportPhoto,

      // HR details
      staffNo,
      jobTitleId,
      departmentId,
      employmentDate,
      employmentType,
      projectId,
      reportingToId,
      endDate,

      // Salary details
      currency,
      basicSalary: basicSalary, // Calculated basic salary
      modeOfPayment,
      amountPerRate: parseFloat(amountPerRate),
      unitsWorked:
        modeOfPayment !== "monthly" ? parseFloat(unitsWorked) || 0 : null,
      paymentMethod: salaryPaymentMethod,
      accountNumber:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? accountNumber
          : null,
      bankName:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? bankName
          : null,
      bankCode:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? bankCode
          : null,
      branchName:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? branchName
          : null,
      branchCode:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? branchCode
          : null,
      accountName:
        salaryPaymentMethod === "bank" || salaryPaymentMethod === "cheque"
          ? accountName
          : null,
      mobileNumber: salaryPaymentMethod === "mobileMoney" ? mobileNumber : null,
      accumulatedLeaveDays,
      utilizedLeaveDays,

      // Tax details
      kraPin,
      nhifNo, // Assuming this field is handled in TaxDetailsForm
      nssfNo,
      shaNo,
      // isExemptedFromTax: taxExemption === "true", // Ensure boolean conversion

      // Contact details
      personalEmail,
      workPhone,
      personalPhone,
      physicalAddress,

      // System fields
      companyId: data.companyId,
      createdByUserId: data.createdByUserId,

      // Additional details for assignments (to be extracted later for separate API calls)
      earnings: earnings,
      deductions: deductions,
    };
  };

  const ActiveComponent = tabs?.[activeTabIndex]?.component;

  return (
    <div className="p-6 bg-gray-200 min-h-screen">
      <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-black">
          Employee Management
        </h1>
        <TabNavigation
          tabs={tabs.map((tab) => tab.name)}
          activeTab={activeTabIndex}
          setActiveTab={handleTabChange}
        />

        {loading && (
          <div className="p-4 mb-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 rounded bg-red-100 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 rounded bg-green-100 text-green-700">
            {success}
          </div>
        )}

        {ActiveComponent ? (
          <FormProvider {...methods}>
            {/* The onSubmit handler is crucial here */}
            <form
              onSubmit={handleFinalSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            >
              {activeTabIndex === 0 ? (
                <PersonalDetailsForm setUploadStatus={setUploadStatus} />
              ) : (
                <ActiveComponent />
              )}

              <div className="flex justify-between mt-6">
                {activeTabIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={loading}
                  >
                    Back
                  </button>
                )}
                {activeTabIndex === tabs.length - 1 ? (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!isCurrentTabValid || loading}
                  >
                    {loading ? "Saving..." : "Continue"}
                  </button>
                )}
                {/* {activeTabIndex === tabs.length - 1 ? (
                  <button
                    type="submit" // This ensures the form's onSubmit is triggered
                    onClick={handleFinalSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={loading} // Only disable based on `loading`
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!isCurrentTabValid || loading}
                  >
                    {loading ? "Saving..." : "Continue"}
                  </button>
                )} */}
              </div>
            </form>
          </FormProvider>
        ) : (
          <div className="text-red-500 mt-6 text-center">
            Something went wrong — no form found for this tab.
          </div>
        )}
      </div>
    </div>
  );
}
