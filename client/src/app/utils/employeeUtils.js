// utils/employeeUtils.js

/**
 * Transform form data to match the API model structure
 * @param {Object} formData - The collected form data
 * @returns {Object} - API formatted data
 */
export const transformEmployeeData = (formData) => {
    // Create a map of form field names to API model field names where they differ
    const fieldMapping = {
      dob: 'dateOfBirth',
      jobTitle: 'jobTitleId',
      department: 'departmentId',
      project: 'projectId'
    };
    
    // Create a new object with proper field names
    const transformedData = { ...formData };
    
    // Apply field name mapping
    Object.keys(fieldMapping).forEach(formField => {
      if (transformedData[formField] !== undefined) {
        transformedData[fieldMapping[formField]] = transformedData[formField];
        delete transformedData[formField];
      }
    });
    
    // Handle nested objects if needed
    if (transformedData.allowances && Array.isArray(transformedData.allowances)) {
      // Format allowances as needed by the API
      transformedData.allowances = transformedData.allowances.map(allowance => ({
        type: allowance.type,
        amount: parseFloat(allowance.amount)
      }));
    }
    
    if (transformedData.deductions && Array.isArray(transformedData.deductions)) {
      // Format deductions as needed by the API
      transformedData.deductions = transformedData.deductions.map(deduction => ({
        type: deduction.type,
        amount: parseFloat(deduction.amount)
      }));
    }
    
    // Set default values required by the API
    if (!transformedData.companyId) {
      transformedData.companyId = 1; // Default company ID
    }
    
    if (!transformedData.Status) {
      transformedData.Status = 'active';
    }
    
    return transformedData;
  };
  
  /**
   * Format dates to API expected format (YYYY-MM-DD)
   * @param {Date|string} date - Date to format
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date) => {
    if (!date) return null;
    
    try {
      // Handle different date formats
      const d = new Date(date);
      if (isNaN(d.getTime())) return null; // Invalid date
      
      // Format to YYYY-MM-DD
      return d.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };
  
  /**
   * Convert form data with File objects to FormData for uploads
   * @param {Object} data - The form data with File objects
   * @returns {FormData} - FormData object for API upload
   */
  export const prepareFormDataWithFiles = (data) => {
    const formData = new FormData();
    
    // Add all non-file fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        // Skip File objects, they will be handled separately
        if (!(data[key] instanceof File) && !(data[key] instanceof FileList)) {
          // If it's an array or object, stringify it
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      }
    });
    
    // Add file objects
    if (data.passportPhoto instanceof File) {
      formData.append('passportPhoto', data.passportPhoto);
    }
    
    if (data.certificatePhoto instanceof File) {
      formData.append('certificatePhoto', data.certificatePhoto);
    }
    
    return formData;
  };
  
  /**
   * Map form data to employee model
   * @param {Object} formData - Combined form data from all sections
   * @returns {Object} - Data formatted for the Employee model
   */
  export const mapToEmployeeModel = (formData) => {
    return {
      // Personal details
      firstName: formData.firstName,
      middleName: formData.middleName || null,
      lastName: formData.lastName,
      gender: formData.gender,
      dateOfBirth: formatDate(formData.dob || formData.dateOfBirth),
      nationalId: formData.nationalId,
      passportNo: formData.passportNo || null,
      maritalStatus: formData.maritalStatus,
      residentialStatus: formData.residentialStatus,
      passportPhoto: formData.passportPhoto,
      
      // Contact details
      workEmail: formData.workEmail,
      personalEmail: formData.personalEmail || null,
      phoneNumber: formData.phoneNumber || null,
      mobileNumber: formData.mobileNumber || null,
      
      // HR details
      staffNo: formData.staffNo,
      companyId: formData.companyId || 1, // Default or from context
      jobTitleId: formData.jobTitleId || formData.jobTitle,
      employeeType: formData.employeeType,
      jobGroup: formData.jobGroup || null,
      departmentId: formData.departmentId || formData.department,
      projectId: formData.projectId || formData.project || null,
      employmentDate: formatDate(formData.employmentDate),
      endDate: formatDate(formData.endDate) || null,
      
      // Salary details
      basicSalary: parseFloat(formData.basicSalary || 0),
      currency: formData.currency || 'KES',
      rateOfPayment: formData.rateOfPayment || null,
      amountPaid: parseFloat(formData.amountPaid || 0),
      methodOfPayment: formData.methodOfPayment || 'Bank Transfer',
      accumulatedLeaveDays: parseInt(formData.accumulatedLeaveDays || 0),
      utilizedLeaveDays: parseInt(formData.utilizedLeaveDays || 0),
      
      // Bank details
      accountNumber: formData.accountNumber || null,
      accountName: formData.accountName || null,
      bankName: formData.bankName || null,
      branchName: formData.branchName || null,
      branchCode: formData.branchCode || null,
      bankCode: formData.bankCode || null,
      
      // Next of kin
      nextOfKinFullName: formData.nextOfKinFullName || null,
      nextOfKinRelationship: formData.nextOfKinRelationship || null,
      nextOfKinPhoneNumber: formData.nextOfKinPhoneNumber || null,
      nextOfKinEmail: formData.nextOfKinEmail || null,
      
      // Tax details
      kraPin: formData.kraPin || null,
      nssfNo: formData.nssfNo || null,
      shaNo: formData.shaNo || null,
      nhifNo: formData.nhifNo || null,
      taxExemption: formData.taxExemption || false,
      certificateNo: formData.certificateNo || null,
      amountExempted: parseFloat(formData.amountExempted || 0),
      certificatePhoto: formData.certificatePhoto || null,
      
      // Status
      Status: formData.Status || 'active',
      
      // We need to handle allowances and deductions separately in the API
      allowances: formData.allowances || [],
      deductions: formData.deductions || [],
      additionalNotes: formData.additionalNotes || null
    };
  };