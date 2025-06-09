// hooks/useEmployee.js
import { useState } from 'react';
import employeeService from '../services/employeeService';

// This hook manages employee form state and API operations
const useEmployee = () => {
  const initialState = {
    // Personal Details
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    nationalId: '',
    passportNo: '',
    maritalStatus: '',
    residentialStatus: '',
    passportPhoto: '',
    
    // Contact Details
    workEmail: '',
    personalEmail: '',
    phoneNumber: '',
    mobileNumber: '',
    
    // HR Details
    staffNo: '',
    companyId: '',
    jobTitleId: '',
    employeeType: '',
    jobGroup: '',
    departmentId: '',
    projectId: '',
    employmentDate: '',
    endDate: '',
    Status: 'active',
    
    // Salary Details
    basicSalary: '',
    currency: 'KES',
    rateOfPayment: '',
    amountPaid: '',
    methodOfPayment: 'Bank Transfer',
    accumulatedLeaveDays: 0,
    utilizedLeaveDays: 0,
    
    // Bank Details
    accountNumber: '',
    accountName: '',
    bankName: '',
    branchName: '',
    branchCode: '',
    bankCode: '',
    
    // Next of Kin
    nextOfKinFullName: '',
    nextOfKinRelationship: '',
    nextOfKinPhoneNumber: '',
    nextOfKinEmail: '',
    
    // Tax Details
    kraPin: '',
    nssfNo: '',
    shaNo: '',
    nhifNo: '',
    taxExemption: false,
    certificateNo: '',
    amountExempted: 0,
    certificatePhoto: '',
    
    // Additional options
    createUserAccount: false,
    initialPassword: '',
  };

  const [employee, setEmployee] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployee({
      ...employee,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle section updates (useful when using component-based forms)
  const updateSection = (section) => {
    setEmployee({
      ...employee,
      ...section
    });
  };

  // Create employee
  const createEmployee = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await employeeService.createEmployee(employee);
      
      setSuccess('Employee created successfully!');
      setEmployee(initialState);
      
      return result;
    } catch (err) {
      setError(err.message || 'Error creating employee');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get employee by ID
  const getEmployeeById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await employeeService.getEmployeeById(id);
      setEmployee(result.data);
      
      return result;
    } catch (err) {
      setError(err.message || 'Error fetching employee');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEmployee(initialState);
    setError(null);
    setSuccess(null);
  };

  return {
    employee,
    loading,
    error,
    success,
    handleChange,
    updateSection,
    createEmployee,
    getEmployeeById,
    resetForm
  };
};

export default useEmployee;