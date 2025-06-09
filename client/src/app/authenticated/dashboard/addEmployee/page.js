'use client'
import { useForm, FormProvider } from "react-hook-form";
import { useState, useEffect } from 'react';
import PersonalDetailsForm from "./personalDetails";
import HRDetailsForm from "./hrDetails";
import SalaryDetailsForm from "./salaryDetails";
import TaxDetailsForm from "./taxDetails";
import TabNavigation from "./tabNavigation";
import ContactsDetailsForm from "./contactDetails";
import { useRouter } from "next/navigation";
import api, { BASE_URL } from '../../../config/api';
import AdditionalDetailsForm from "./additionalDetails";

export default function AddEmployee() {
  const router = useRouter();
  const [employeeData, setEmployeeData] = useState({
    personalDetails: {},
    hrDetails: {},
    salaryDetails: {},
    contactsDetails: {},
    taxDetails: {},
    additionalDetails: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {}
  });

  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    error: null,
    success: false
  });

  const tabs = [
    { name: 'Personal Details', component: PersonalDetailsForm, key: 'personalDetails' },
    { name: 'HR Details', component: HRDetailsForm, key: 'hrDetails' },
    { name: 'Salary Details', component: SalaryDetailsForm, key: 'salaryDetails' },
    { name: 'Contacts Details', component: ContactsDetailsForm, key: 'contactsDetails' },
    { name: 'Tax Details', component: TaxDetailsForm, key: 'taxDetails' },
    { name: 'Additional Details', component: AdditionalDetailsForm, key: 'additionalDetails' },

  ];

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const selectedPaymentMethod = methods.getValues("paymentMethod");
      const modeOfPayment = methods.getValues("modeOfPayment"); 

      
      
      // Always validate these basic fields
      let fieldsToValidate = [
        "currency",
        "basicSalary",
        "paymentMethod",
        "accumulatedLeaveDays",
        "utilizedLeaveDays"
      ];

       // Add unitsWorked if payment mode is not monthly
      if (modeOfPayment !== 'monthly') {
      fieldsToValidate.push("unitsWorked");
      }
      
      // Add payment-specific fields based on payment method
      if (selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'cheque') {
        fieldsToValidate.push(
          "bankName",
          "accountNumber",
          "bankCode",
          "branchName",
          "branchCode",
          "accountName"
        );


      }  
      else if (selectedPaymentMethod === 'mobileMoney') {
        // if (!fieldsToValidate.mobileNumber) {
        //   setError('mobileNumber', {
        //     type: 'manual',
        //     message: 'Mobile number is required'
        //   });
        //   return;
        fieldsToValidate.push("mobileNumber");
        }

        // selectedPaymentMethod.paymentMethod = 'mobileMoney';



      // }
      
      // Validate only relevant fields
      const isValid = await methods.trigger(fieldsToValidate);
      
      if (!isValid) {
        const errorMessages = Object.entries(methods.formState.errors)
          .filter(([field]) => fieldsToValidate.includes(field))
          .map(([_, error]) => error.message)
          .filter(Boolean)
          .join(', ');
        
        setError(`Please fix these issues before submitting: ${errorMessages || 'Some required fields are missing'}`);
        setLoading(false);
        return;
      }
  
      const currentFormData = methods.getValues();
      const currentTab = tabs[activeTabIndex];
      const sectionKey = currentTab.key;
      
      // Combine all data and flatten the structure
      const completeData = {
        ...employeeData,
        [sectionKey]: currentFormData,
        companyId: localStorage.getItem('companyId'),
        createdByUserId: localStorage.getItem('createdByUserId')
      };
  
      // Flatten the data structure for backend
      const flattenedData = flattenEmployeeData(completeData);
      
      const response = await api.post(`${BASE_URL}/employees`, flattenedData);
      
      setSuccess('Employee added successfully!');
      setTimeout(() => {
        router.push('/authenticated/dashboard/List');
      }, 2000);
    } catch (err) {
      console.error("Submission error:", err);
      const errorMessage = err.response?.data?.message ||
                          err.message ||
                          'Failed to submit employee data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to flatten the data structure
  const flattenEmployeeData = (data) => {
    console.log("Personal details before flattening:", data.personalDetails);

    let basicSalary = 0;
    if (data.salaryDetails.modeOfPayment === 'monthly') {
      basicSalary = parseFloat(data.salaryDetails.amountPerRate) || 0;
    } else {
      basicSalary = (parseFloat(data.salaryDetails.amountPerRate) || 0) * 
                   (parseFloat(data.salaryDetails.unitsWorked) || 0);
    }
    basicSalary = parseFloat(basicSalary.toFixed(2));






    const paymentMethod = data.salaryDetails.paymentMethod;




    return {
      // Personal details
      firstName: data.personalDetails.firstName,
      middleName: data.personalDetails.middleName || '',
      lastName: data.personalDetails.lastName,
      gender: data.personalDetails.gender,
      dateOfBirth: data.personalDetails.dob, 
      nationalId: data.personalDetails.nationalId,
      passportNo: data.personalDetails.passportNo || '',
      maritalStatus: data.personalDetails.maritalStatus,
      residentialStatus: data.personalDetails.residentialStatus,
      workEmail: data.personalDetails.workEmail || data.contactsDetails.workEmail,
      passportPhoto: data.personalDetails.passportPhoto || '',


      // HR details
      staffNo: data.hrDetails.staffNo,
      jobTitleId: data.hrDetails.jobTitleId,
      departmentId: data.hrDetails.departmentId,
      employmentDate: data.hrDetails.employmentDate,
      employmentType: data.hrDetails.employmentType,
      projectId: data.hrDetails.projectId || null,
      reportingToId: data.hrDetails.reportingToId || null,
      endDate: data.hrDetails.endDate || null,

      // Salary details
      currency: data.salaryDetails.currency,
      basicSalary: basicSalary,
      modeOfPayment: data.salaryDetails.modeOfPayment,
      amountPerRate: parseFloat(data.salaryDetails.amountPerRate),
      unitsWorked: data.salaryDetails.modeOfPayment !== 'monthly' ? parseFloat(data.salaryDetails.unitsWorked) : null,
      paymentMethod: paymentMethod,
      accountNumber: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.accountNumber : null,
      bankName: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.bankName : null,
      bankCode: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.bankCode : null,
      branchName: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.branchName : null,
      branchCode: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.branchCode : null,
      accountName: paymentMethod === 'bank' || paymentMethod === 'cheque' ? data.salaryDetails.accountName : null,
      mobileNumber: paymentMethod === 'mobileMoney' ? data.salaryDetails.mobileNumber : null,
      accumulatedLeaveDays: data.salaryDetails.accumulatedLeave || 0,
      utilizedLeaveDays: data.salaryDetails.utilizedLeave || 0,

      // Tax details
      kraPin: data.taxDetails.kraPin,
      nhifNo: data.taxDetails.nhifNo,
      nssfNo: data.taxDetails.nssfNo,
      shaNo: data.taxDetails.shaNo,
      isExemptedFromTax: data.taxDetails.taxExemption === 'true',

      // Contact details
      personalEmail: data.contactsDetails.personalEmail || null,
      workPhone: data.contactsDetails.workPhone,
      personalPhone: data.contactsDetails.personalPhone || null,
      physicalAddress: data.contactsDetails.physicalAddress,

      // System fields
      companyId: data.companyId,
      createdByUserId: data.createdByUserId
    };
  };
 
  const handleContinue = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      const selectedPaymentMethod = methods.getValues("paymentMethod");
      const modeOfPayment = methods.getValues("modeOfPayment");

      
      // Always validate these basic fields
      let fieldsToValidate = [
        "currency",
        "amountPerRate",
        "modeOfPayment",
        "paymentMethod",
        "accumulatedLeaveDays",
        "utilizedLeaveDays"
      ];

       // Add unitsWorked if payment mode is not monthly
    if (modeOfPayment !== 'monthly') {
      fieldsToValidate.push("unitsWorked");
    }
      
      // Add payment-specific fields based on payment method
      if (selectedPaymentMethod === 'bank' || selectedPaymentMethod === 'cheque') {
        fieldsToValidate.push(
          "bankName",
          "accountNumber",
          "bankCode",
          "branchName",
          "branchCode",
          "accountName"
        );
      } else if (selectedPaymentMethod === 'mobileMoney') {
        fieldsToValidate.push("mobileNumber");
      }
      
      // Validate only relevant fields
      const isValid = await methods.trigger(fieldsToValidate);
      
      if (!isValid) {
        const errorMessages = Object.entries(methods.formState.errors)
          .filter(([field]) => fieldsToValidate.includes(field))
          .map(([_, error]) => error.message)
          .filter(Boolean)
          .join(', ');
        
        setError(errorMessages || 'Please complete all required fields');
        return;
      }
  
      // Save current tab data
      const currentTab = tabs[activeTabIndex];
      const sectionKey = currentTab.key;
      
      setEmployeeData(prev => ({
        ...prev,
        [sectionKey]: methods.getValues()
      }));
  
      // Move to next tab
      setActiveTabIndex(activeTabIndex + 1);
      setSuccess(`${currentTab.name} saved successfully!`);
      
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "An error occurred while saving");
    }
  };

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


  const handleBack = () => {
    if (activeTabIndex > 0) {
      const allFormData = methods.getValues();
      setEmployeeData(prev => ({ ...prev, ...allFormData }));
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const handleTabChange = (index) => {
    const allFormData = methods.getValues();
    setEmployeeData(prev => ({ ...prev, ...allFormData }));
    setActiveTabIndex(index);
  };

  useEffect(() => {
    const currentTab = tabs[activeTabIndex];
    if (currentTab) {
      // Save current form data before resetting
      if (activeTabIndex > 0) {
        const allFormData = methods.getValues();
        setEmployeeData(prev => {
          const prevTabKey = tabs[activeTabIndex - 1].key;
          return { ...prev, [prevTabKey]: allFormData };
        });
      }
      
      // Reset form with data for the current tab
      methods.reset(employeeData[currentTab.key] || {});
    }
  }, [activeTabIndex]);

  const ActiveComponent = tabs?.[activeTabIndex]?.component;

  return (
    <div className="p-6 bg-gray-200 min-h-screen">
      <div className="bg-white p-6 rounded shadow-md max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-black">Employee Management</h1>
        <TabNavigation
          tabs={tabs.map(tab => tab.name)}
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
            <form onSubmit={methods.handleSubmit(handleFinalSubmit)}>
            {activeTabIndex === 0 ? (
          <PersonalDetailsForm 
            setUploadStatus={setUploadStatus}
          />
        ) : (
              <ActiveComponent />

        )}

              <div className="flex justify-between mt-6">
                {activeTabIndex > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Back
                  </button>
                )}

                {activeTabIndex === tabs.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto"
                    disabled={loading}
                  >
                    Submit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-auto"
                  >
                    Continue
                  </button>
                )}
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
