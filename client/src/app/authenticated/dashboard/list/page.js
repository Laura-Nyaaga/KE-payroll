'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import api from '@/app/config/api';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employmentTypes] = useState(['Permanent', 'Full-time', 'Regular', 'Contract', 'Internship', 'Probationary', 'Part-Time', 'Casual']);
  const [paymentMethods] = useState(['Bank', 'Cash', 'Check', 'Mobile Money']);
  const [employeeStatuses] = useState(['Active', 'Inactive']);
  const [managers, setManagers] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [fetchRetries, setFetchRetries] = useState(0);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [earningTypes, setEarningTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Column customization
  const allColumns = [
    { key: 'staffNo', label: 'Employee NO' },
    { key: 'firstName', label: 'First Name' },
    { key: 'middleName', label: 'Middle Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'workEmail', label: 'Work Email' },
    { key: 'department', label: 'Department', render: emp => emp.department?.title || 'N/A' },
    { key: 'jobTitle', label: 'Job Title', render: emp => emp.jobTitle?.name || 'N/A' },
    { key: 'employmentType', label: 'Employment Type' },
    { key: 'basicSalary', label: 'Basic Salary', render: emp => `Ksh ${parseFloat(emp.basicSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { key: 'status', label: 'Status' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'nationalId', label: 'National ID' },
    { key: 'passportNo', label: 'Passport No' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'residentialStatus', label: 'Residential Status' },
    { key: 'employmentDate', label: 'Employment Date' },
    { key: 'endDate', label: 'End Date', render: emp => emp.endDate || 'N/A' },
    { key: 'currency', label: 'Currency' },
    { key: 'modeOfPayment', label: 'Mode of Payment' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'kraPin', label: 'KRA PIN' },
    { key: 'nssfNo', label: 'NSSF No' },
    { key: 'shaNo', label: 'SHA No' },
    { key: 'isExemptedFromTax', label: 'Tax Exempt', render: emp => emp.isExemptedFromTax ? 'Yes' : 'No' },
    { key: 'personalEmail', label: 'Personal Email' },
    { key: 'workPhone', label: 'Work Phone' },
    { key: 'personalPhone', label: 'Personal Phone' },
    { key: 'physicalAddress', label: 'Physical Address' },
  ];

  const defaultColumns = allColumns.slice(0, 10).map(col => col.key);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

useEffect(() => {
  const saved = localStorage.getItem('employeeListColumns');
  if (saved) setVisibleColumns(JSON.parse(saved));
}, []);
  // const [visibleColumns, setVisibleColumns] = useState(() => {
  //   const saved = localStorage.getItem('employeeListColumns');
  //   return saved ? JSON.parse(saved) : defaultColumns;
  // });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const tableRef = useRef(null);
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Earnings/Deductions modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentType, setAssignmentType] = useState('');
  const [assignmentData, setAssignmentData] = useState({
    typeId: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    customPercentage: '',
    customMonthlyAmount: '',
    customNumberOfHours: '',
    customHourlyRate: '',
    customNumberOfDays: '',
    customDailyRate: '',
    customNumberOfWeeks: '',
    customWeeklyRate: '',
  });
  const [editingAssignmentIndex, setEditingAssignmentIndex] = useState(null);

  // Fetch data
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) throw new Error('Company ID not found in local storage.');
      const response = await api.get(`/employees/company/${companyId}`);
      setEmployees(response.data);
      setFilteredEmployees(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.get(`/departments/companies/${companyId}`);
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  const fetchJobTitles = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.get(`/job-titles/companies/${companyId}`);
      setJobTitles(response.data);
    } catch (err) {
      console.error('Failed to fetch job titles:', err);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.get(`/employees/company/${companyId}`);
      setManagers(response.data);
    } catch (err) {
      console.error('Failed to fetch managers:', err);
    }
  }, []);

  const fetchEarningTypes = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.get(`/earnings/company/${companyId}`);
      setEarningTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch earning types:', err);
    }
  }, []);

  const fetchDeductionTypes = useCallback(async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      const response = await api.get(`/deductions/company/${companyId}`);
      setDeductionTypes(response.data);
    } catch (err) {
      console.error('Failed to fetch deduction types:', err);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchJobTitles();
    fetchManagers();
    fetchEarningTypes();
    fetchDeductionTypes();
  }, [fetchRetries, fetchEmployees, fetchDepartments, fetchJobTitles, fetchManagers, fetchEarningTypes, fetchDeductionTypes]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery) {
      setFilteredEmployees(employees);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = employees.filter(emp =>
      emp.firstName?.toLowerCase().includes(lowerQuery) ||
      emp.lastName?.toLowerCase().includes(lowerQuery) ||
      emp.workEmail?.toLowerCase().includes(lowerQuery) ||
      emp.staffNo?.toLowerCase().includes(lowerQuery)
    );
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchQuery, employees]);

  // Column customization persistence
  useEffect(() => {
    localStorage.setItem('employeeListColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const handleEditClick = (employee) => {
    setEditingEmployee({
      ...employee,
      earnings: employee.earnings || [],
      deductions: employee.deductions || [],
    });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setEditingEmployee(null);
    setShowEditModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingEmployee(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAssignmentModalOpen = (type, index = null) => {
    setAssignmentType(type);
    if (index !== null) {
      const item = editingEmployee[type][index];
      const typeData = type === 'earnings' ? earningTypes.find(t => t.id === item.id) : deductionTypes.find(t => t.id === item.id);
      setAssignmentData({
        typeId: item.id,
        effectiveDate: item.effectiveDate,
        endDate: item.endDate || '',
        customPercentage: item.details.customPercentage || '',
        customMonthlyAmount: item.details.customMonthlyAmount || '',
        customNumberOfHours: item.details.customNumberOfHours || '',
        customHourlyRate: item.details.customHourlyRate || '',
        customNumberOfDays: item.details.customNumberOfDays || '',
        customDailyRate: item.details.customDailyRate || '',
        customNumberOfWeeks: item.details.customNumberOfWeeks || '',
        customWeeklyRate: item.details.customWeeklyRate || '',
      });
      setEditingAssignmentIndex(index);
    } else {
      setAssignmentData({
        typeId: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        endDate: '',
        customPercentage: '',
        customMonthlyAmount: '',
        customNumberOfHours: '',
        customHourlyRate: '',
        customNumberOfDays: '',
        customDailyRate: '',
        customNumberOfWeeks: '',
        customWeeklyRate: '',
      });
      setEditingAssignmentIndex(null);
    }
    setShowAssignmentModal(true);
  };

  const handleAssignmentModalClose = () => {
    setShowAssignmentModal(false);
    setAssignmentData({
      typeId: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      customPercentage: '',
      customMonthlyAmount: '',
      customNumberOfHours: '',
      customHourlyRate: '',
      customNumberOfDays: '',
      customDailyRate: '',
      customNumberOfWeeks: '',
      customWeeklyRate: '',
    });
    setEditingAssignmentIndex(null);
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({ ...prev, [name]: value }));
  };

  const calculateAssignmentAmount = () => {
    const typeData = assignmentType === 'earnings'
      ? earningTypes.find(t => t.id === parseInt(assignmentData.typeId))
      : deductionTypes.find(t => t.id === parseInt(assignmentData.typeId));
    if (!typeData) return '0.00';

    const { calculationMethod, mode } = typeData;
    const {
      customPercentage, customMonthlyAmount, customNumberOfHours, customHourlyRate,
      customNumberOfDays, customDailyRate, customNumberOfWeeks, customWeeklyRate
    } = assignmentData;

    let calculated = 0;
    if (calculationMethod === 'percentage') {
      return `${parseFloat(customPercentage || 0).toFixed(2)}%`;
    } else if (calculationMethod === 'fixed_amount') {
      switch (mode) {
        case 'monthly': calculated = parseFloat(customMonthlyAmount || 0); break;
        case 'hourly': calculated = parseFloat(customNumberOfHours || 0) * parseFloat(customHourlyRate || 0); break;
        case 'daily': calculated = parseFloat(customNumberOfDays || 0) * parseFloat(customDailyRate || 0); break;
        case 'weekly': calculated = parseFloat(customNumberOfWeeks || 0) * parseFloat(customWeeklyRate || 0); break;
        default: calculated = parseFloat(customMonthlyAmount || 0);
      }
    }
    return parseFloat(calculated).toFixed(2);
  };

  const handleSaveAssignment = () => {
    const typeData = assignmentType === 'earnings'
      ? earningTypes.find(t => t.id === parseInt(assignmentData.typeId))
      : deductionTypes.find(t => t.id === parseInt(assignmentData.typeId));
    if (!typeData) return;

    const newItem = {
      id: parseInt(assignmentData.typeId),
      name: assignmentType === 'earnings' ? typeData.earningsType : typeData.deductionType,
      effectiveDate: assignmentData.effectiveDate,
      endDate: assignmentData.endDate || null,
      calculationMethod: typeData.calculationMethod,
      mode: typeData.mode,
      calculatedAmount: calculateAssignmentAmount(),
      details: { ...assignmentData },
    };

    setEditingEmployee(prev => {
      const updatedItems = editingAssignmentIndex !== null
        ? prev[assignmentType].map((item, i) => i === editingAssignmentIndex ? newItem : item)
        : [...prev[assignmentType], newItem];
      return { ...prev, [assignmentType]: updatedItems };
    });

    handleAssignmentModalClose();
  };

  const handleRemoveAssignment = (type, index) => {
    setEditingEmployee(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const renderAssignmentFields = () => {
    const typeData = assignmentType === 'earnings'
      ? earningTypes.find(t => t.id === parseInt(assignmentData.typeId))
      : deductionTypes.find(t => t.id === parseInt(assignmentData.typeId));
    if (!typeData) return null;

    const { calculationMethod, mode, fixedAmount } = typeData;
    if (calculationMethod === 'percentage') {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Percentage (%)</label>
          <input
            type="number"
            name="customPercentage"
            value={assignmentData.customPercentage}
            onChange={handleAssignmentInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            step="0.01"
            min="0"
            max="100"
            placeholder={fixedAmount ? `Default: ${fixedAmount}%` : 'Enter percentage'}
          />
        </div>
      );
    } else if (calculationMethod === 'fixed_amount') {
      switch (mode) {
        case 'monthly':
          return (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
              <input
                type="number"
                name="customMonthlyAmount"
                value={assignmentData.customMonthlyAmount}
                onChange={handleAssignmentInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                step="0.01"
                min="0"
                placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter amount'}
              />
            </div>
          );
        case 'hourly':
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Number of Hours</label>
                <input
                  type="number"
                  name="customNumberOfHours"
                  value={assignmentData.customNumberOfHours}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                <input
                  type="number"
                  name="customHourlyRate"
                  value={assignmentData.customHourlyRate}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter rate'}
                />
              </div>
            </>
          );
        case 'daily':
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Number of Days</label>
                <input
                  type="number"
                  name="customNumberOfDays"
                  value={assignmentData.customNumberOfDays}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Daily Rate</label>
                <input
                  type="number"
                  name="customDailyRate"
                  value={assignmentData.customDailyRate}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter rate'}
                />
              </div>
            </>
          );
        case 'weekly':
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Number of Weeks</label>
                <input
                  type="number"
                  name="customNumberOfWeeks"
                  value={assignmentData.customNumberOfWeeks}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Weekly Rate</label>
                <input
                  type="number"
                  name="customWeeklyRate"
                  value={assignmentData.customWeeklyRate}
                  onChange={handleAssignmentInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter rate'}
                />
              </div>
            </>
          );
        default:
          return (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                name="customMonthlyAmount"
                value={assignmentData.customMonthlyAmount}
                onChange={handleAssignmentInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                step="0.01"
                min="0"
                placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter amount'}
              />
            </div>
          );
      }
    }
    return null;
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (!editingEmployee || !editingEmployee.id) throw new Error('Invalid employee data');

      // Construct employee payload
      const employeePayload = {
        firstName: editingEmployee.firstName,
        middleName: editingEmployee.middleName || null,
        lastName: editingEmployee.lastName,
        dateOfBirth: editingEmployee.dateOfBirth || null,
        nationalId: editingEmployee.nationalId || null,
        passportNo: editingEmployee.passportNo || null,
        maritalStatus: editingEmployee.maritalStatus || null,
        residentialStatus: editingEmployee.residentialStatus || null,
        workEmail: editingEmployee.workEmail,
        passportPhoto: editingEmployee.passportPhoto || null,
        staffNo: editingEmployee.staffNo || null,
        jobTitleId: parseInt(editingEmployee.jobTitleId) || null,
        departmentId: parseInt(editingEmployee.departmentId) || null,
        employmentDate: editingEmployee.employmentDate || null,
        employmentType: editingEmployee.employmentType || null,
        projectId: parseInt(editingEmployee.projectId) || null,
        reportingToId: parseInt(editingEmployee.reportingToId) || null,
        endDate: editingEmployee.endDate || null,
        currency: editingEmployee.currency || null,
        basicSalary: parseFloat(editingEmployee.basicSalary) || 0,
        modeOfPayment: editingEmployee.modeOfPayment || null,
        amountPerRate: parseFloat(editingEmployee.amountPerRate) || 0,
        unitsWorked: parseFloat(editingEmployee.unitsWorked) || null,
        paymentMethod: editingEmployee.paymentMethod || null,
        accountNumber: editingEmployee.accountNumber || null,
        bankName: editingEmployee.bankName || null,
        bankCode: editingEmployee.bankCode || null,
        branchName: editingEmployee.branchName || null,
        branchCode: editingEmployee.branchCode || null,
        accountName: editingEmployee.accountName || null,
        mobileNumber: editingEmployee.mobileNumber || null,
        kraPin: editingEmployee.kraPin || null,
        nhifNo: editingEmployee.nhifNo || null,
        nssfNo: editingEmployee.nssfNo || null,
        shaNo: editingEmployee.shaNo || null,
        isExemptedFromTax: !!editingEmployee.isExemptedFromTax,
        personalEmail: editingEmployee.personalEmail || null,
        workPhone: editingEmployee.workPhone || null,
        personalPhone: editingEmployee.personalPhone || null,
        physicalAddress: editingEmployee.physicalAddress || null,
        createdByUserId: editingEmployee.createdByUserId || localStorage.getItem('createdByUserId'),
        status: editingEmployee.status || 'Active',
      };

      // Update employee
      const response = await api.put(`/employees/${editingEmployee.id}`, employeePayload);
      const updatedEmployee = response.data;

      // Update earnings assignments
      const earningsAssignments = editingEmployee.earnings.map(item => ({
        employeeId: editingEmployee.id,
        earningsId: item.id,
        effectiveDate: item.effectiveDate,
        endDate: item.endDate || null,
        ...(item.calculationMethod === 'percentage' && {
          customPercentage: parseFloat(item.details.customPercentage) || 0,
        }),
        ...(item.calculationMethod === 'fixed_amount' && {
          ...(item.mode === 'monthly' && { customMonthlyAmount: parseFloat(item.details.customMonthlyAmount) || 0 }),
          ...(item.mode === 'hourly' && {
            customNumberOfHours: parseFloat(item.details.customNumberOfHours) || 0,
            customHourlyRate: parseFloat(item.details.customHourlyRate) || 0,
          }),
          ...(item.mode === 'daily' && {
            customNumberOfDays: parseFloat(item.details.customNumberOfDays) || 0,
            customDailyRate: parseFloat(item.details.customDailyRate) || 0,
          }),
          ...(item.mode === 'weekly' && {
            customNumberOfWeeks: parseFloat(item.details.customNumberOfWeeks) || 0,
            customWeeklyRate: parseFloat(item.details.customWeeklyRate) || 0,
          }),
        }),
      }));

      await Promise.all(earningsAssignments.map(async (assignment, index) => {
        try {
          await api.post(`/earnings/assign`, assignment);
        } catch (err) {
          throw new Error(`Earnings Assignment ${index}: ${err.response?.data?.message || err.message}`);
        }
      }));

      // Update deductions assignments
      const deductionsAssignments = editingEmployee.deductions.map(item => ({
        employeeId: editingEmployee.id,
        deductionId: item.id, // Ensure deductionId is used
        effectiveDate: item.effectiveDate,
        endDate: item.endDate || null,
        ...(item.calculationMethod === 'percentage' && {
          customPercentage: parseFloat(item.details.customPercentage) || 0,
        }),
        ...(item.calculationMethod === 'fixed_amount' && {
          ...(item.mode === 'monthly' && { customMonthlyAmount: parseFloat(item.details.customMonthlyAmount) || 0 }),
          ...(item.mode === 'hourly' && {
            customNumberOfHours: parseFloat(item.details.customNumberOfHours) || 0,
            customHourlyRate: parseFloat(item.details.customHourlyRate) || 0,
          }),
          ...(item.mode === 'daily' && {
            customNumberOfDays: parseFloat(item.details.customNumberOfDays) || 0,
            customDailyRate: parseFloat(item.details.customDailyRate) || 0,
          }),
          ...(item.mode === 'weekly' && {
            customNumberOfWeeks: parseFloat(item.details.customNumberOfWeeks) || 0,
            customWeeklyRate: parseFloat(item.details.customWeeklyRate) || 0,
          }),
        }),
      }));

      await Promise.all(deductionsAssignments.map(async (assignment, index) => {
        try {
          await api.post(`/deductions/assign`, assignment);
        } catch (err) {
          throw new Error(`Deduction Assignment ${index}: ${err.response?.data?.message || err.message}`);
        }
      }));

      // Update local state
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        ...updatedEmployee,
        department: departments.find(d => d.id === updatedEmployee.departmentId) || null,
        jobTitle: jobTitles.find(jt => jt.id === updatedEmployee.jobTitleId) || null,
        reportingTo: managers.find(m => m.id === updatedEmployee.reportingToId) || null,
        earnings: editingEmployee.earnings,
        deductions: editingEmployee.deductions,
      } : emp));
      setFilteredEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        ...updatedEmployee,
        department: departments.find(d => d.id === updatedEmployee.departmentId) || null,
        jobTitle: jobTitles.find(jt => jt.id === updatedEmployee.jobTitleId) || null,
        reportingTo: managers.find(m => m.id === updatedEmployee.reportingToId) || null,
        earnings: editingEmployee.earnings,
        deductions: editingEmployee.deductions,
      } : emp));

      setShowEditModal(false);
      setNotification({ show: true, message: 'Employee updated successfully', type: 'success' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
    } catch (err) {
      setNotification({ show: true, message: `Failed to update employee: ${err.message}`, type: 'error' });
      setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRetry = () => {
    setFetchRetries(prev => prev + 1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleColumnToggle = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(col => col !== key) : [...prev, key]
    );
  };

  const handleResetColumns = () => {
    setVisibleColumns(defaultColumns);
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Employee List</h1>

      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}

      {/* Search and Column Customization */}
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by name, email, or staff number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
        <button
          onClick={() => setShowColumnModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Customize Columns
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span>{error}</span>
          <button onClick={handleRetry} className="ml-4 px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800">Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-4 text-right">
            <Link href="/authenticated/dashboard/addEmployee" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700">
              Add New Employee
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="min-w-full leading-normal">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    {allColumns
                      .filter(col => visibleColumns.includes(col.key))
                      .map(col => (
                        <th key={col.key} className="py-3 px-6 text-left">{col.label}</th>
                      ))}
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map(employee => (
                      <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-100">
                        {allColumns
                          .filter(col => visibleColumns.includes(col.key))
                          .map(col => (
                            <td key={col.key} className="py-3 px-6 text-left">
                              {col.render ? col.render(employee) : employee[col.key] || 'N/A'}
                            </td>
                          ))}
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => handleEditClick(employee)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="py-4 text-center text-gray-500">No employees found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 flex justify-center items-center space-x-2 bg-gray-50 border-t">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 rounded-md ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Employee</h2>
            {updateLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-60">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            <form onSubmit={handleSaveEdit}>
              {/* Personal Details */}
              <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                  <input
                    type="text"
                    value={editingEmployee.id}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editingEmployee.firstName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={editingEmployee.middleName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editingEmployee.lastName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <input
                    type="text"
                    value={editingEmployee.gender || ''}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={editingEmployee.dateOfBirth || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">National ID</label>
                  <input
                    type="text"
                    name="nationalId"
                    value={editingEmployee.nationalId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passport No</label>
                  <input
                    type="text"
                    name="passportNo"
                    value={editingEmployee.passportNo || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={editingEmployee.maritalStatus || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Residential Status</label>
                  <select
                    name="residentialStatus"
                    value={editingEmployee.residentialStatus || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="Resident">Resident</option>
                    <option value="Non-Resident">Non-Resident</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Email</label>
                  <input
                    type="email"
                    name="workEmail"
                    value={editingEmployee.workEmail || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passport Photo URL</label>
                  <input
                    type="text"
                    name="passportPhoto"
                    value={editingEmployee.passportPhoto || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
              </div>

              {/* HR Details */}
              <h3 className="text-lg font-semibold mb-2">HR Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Staff Number</label>
                  <input
                    type="text"
                    name="staffNo"
                    value={editingEmployee.staffNo || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Title</label>
                  <select
                    name="jobTitleId"
                    value={editingEmployee.jobTitleId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select Job Title</option>
                    {jobTitles.map(title => (
                      <option key={title.id} value={title.id}>{title.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    name="departmentId"
                    value={editingEmployee.departmentId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Date</label>
                  <input
                    type="date"
                    name="employmentDate"
                    value={editingEmployee.employmentDate || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                  <select
                    name="employmentType"
                    value={editingEmployee.employmentType || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select Type</option>
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project ID</label>
                  <input
                    type="text"
                    name="projectId"
                    value={editingEmployee.projectId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reporting To</label>
                  <select
                    name="reportingToId"
                    value={editingEmployee.reportingToId || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>{manager.firstName} {manager.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={editingEmployee.endDate || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
              </div>

              {/* Salary Details */}
              <h3 className="text-lg font-semibold mb-2">Salary Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <input
                    type="text"
                    name="currency"
                    value={editingEmployee.currency || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={editingEmployee.basicSalary || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mode of Payment</label>
                  <select
                    name="modeOfPayment"
                    value={editingEmployee.modeOfPayment || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select</option>
                    <option value="monthly">Monthly</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount per Rate</label>
                  <input
                    type="number"
                    name="amountPerRate"
                    value={editingEmployee.amountPerRate || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Units Worked</label>
                  <input
                    type="number"
                    name="unitsWorked"
                    value={editingEmployee.unitsWorked || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={editingEmployee.paymentMethod || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                  >
                    <option value="">Select</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={editingEmployee.accountNumber || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={editingEmployee.bankName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Code</label>
                  <input
                    type="text"
                    name="bankCode"
                    value={editingEmployee.bankCode || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                  <input
                    type="text"
                    name="branchName"
                    value={editingEmployee.branchName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch Code</label>
                  <input
                    type="text"
                    name="branchCode"
                    value={editingEmployee.branchCode || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Name</label>
                  <input
                    type="text"
                    name="accountName"
                    value={editingEmployee.accountName || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    value={editingEmployee.mobileNumber || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
              </div>

              {/* Tax Details */}
              <h3 className="text-lg font-semibold mb-2">Tax Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">KRA PIN</label>
                  <input
                    type="text"
                    name="kraPin"
                    value={editingEmployee.kraPin || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">NSSF No</label>
                  <input
                    type="text"
                    name="nssfNo"
                    value={editingEmployee.nssfNo || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SHA No</label>
                  <input
                    type="text"
                    name="shaNo"
                    value={editingEmployee.shaNo || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tax Exempt</label>
                  <input
                    type="checkbox"
                    name="isExemptedFromTax"
                    checked={editingEmployee.isExemptedFromTax || false}
                    onChange={handleInputChange}
                    className="mt-1 h-5 w-5"
                  />
                </div>
              </div>

              {/* Contact Details */}
              <h3 className="text-lg font-semibold mb-2">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={editingEmployee.personalEmail || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Phone</label>
                  <input
                    type="text"
                    name="workPhone"
                    value={editingEmployee.workPhone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Personal Phone</label>
                  <input
                    type="text"
                    name="personalPhone"
                    value={editingEmployee.personalPhone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Physical Address</label>
                  <input
                    type="text"
                    name="physicalAddress"
                    value={editingEmployee.physicalAddress || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  />
                </div>
              </div>

              {/* Additional Details: Earnings */}
              <h3 className="text-lg font-semibold mb-2">Earnings</h3>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleAssignmentModalOpen('earnings')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Earnings
                </button>
                {editingEmployee.earnings.length > 0 && (
                  <table className="min-w-full mt-4 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Method</th>
                        <th className="py-2 px-4 text-left">Mode</th>
                        <th className="py-2 px-4 text-left">Effective Date</th>
                        <th className="py-2 px-4 text-left">End Date</th>
                        <th className="py-2 px-4 text-left">Amount</th>
                        <th className="py-2 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingEmployee.earnings.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-4">{item.name}</td>
                          <td className="py-2 px-4">{item.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                          <td className="py-2 px-4">{item.mode || 'N/A'}</td>
                          <td className="py-2 px-4">{item.effectiveDate}</td>
                          <td className="py-2 px-4">{item.endDate || 'N/A'}</td>
                          <td className="py-2 px-4">Ksh {item.calculatedAmount}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleAssignmentModalOpen('earnings', index)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-6.586 6.586a1 1 0 01-.293.207l-4 1a1 1 0 01-1.207-1.207l1-4a1 1 0 01.207-.293l6.586-6.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment('earnings', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Additional Details: Deductions */}
              <h3 className="text-lg font-semibold mb-2">Deductions</h3>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => handleAssignmentModalOpen('deductions')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Deduction
                </button>
                {editingEmployee.deductions.length > 0 && (
                  <table className="min-w-full mt-4 border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Method</th>
                        <th className="py-2 px-4 text-left">Mode</th>
                        <th className="py-2 px-4 text-left">Effective Date</th>
                        <th className="py-2 px-4 text-left">End Date</th>
                        <th className="py-2 px-4 text-left">Amount</th>
                        <th className="py-2 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingEmployee.deductions.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-4">{item.name}</td>
                          <td className="py-2 px-4">{item.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                          <td className="py-2 px-4">{item.mode || 'N/A'}</td>
                          <td className="py-2 px-4">{item.effectiveDate}</td>
                          <td className="py-2 px-4">{item.endDate || 'N/A'}</td>
                          <td className="py-2 px-4">Ksh {item.calculatedAmount}</td>
                          <td className="py-2 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleAssignmentModalOpen('deductions', index)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-6.586 6.586a1 1 0 01-.293.207l-4 1a1 1 0 01-1.207-1.207l1-4a1 1 0 01.207-.293l6.586-6.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAssignment('deductions', index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingAssignmentIndex !== null ? `Edit ${assignmentType}` : `Add ${assignmentType}`}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{assignmentType === 'earnings' ? 'Earnings Type' : 'Deduction Type'}</label>
              <select
                name="typeId"
                value={assignmentData.typeId}
                onChange={handleAssignmentInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white"
                required
              >
                <option value="">Select Type</option>
                {(assignmentType === 'earnings' ? earningTypes : deductionTypes).map(type => (
                  <option key={type.id} value={type.id}>
                    {type[assignmentType === 'earnings' ? 'earningsType' : 'deductionType']}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Effective Date</label>
              <input
                type="date"
                name="effectiveDate"
                value={assignmentData.effectiveDate}
                onChange={handleAssignmentInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
              <input
                type="date"
                name="endDate"
                value={assignmentData.endDate}
                onChange={handleAssignmentInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            {renderAssignmentFields()}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <label className="block text-sm font-medium text-blue-800">Calculated Amount</label>
              <input
                type="text"
                value={`Ksh ${calculateAssignmentAmount()}`}
                readOnly
                className="mt-1 block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 bg-blue-100"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleAssignmentModalClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingAssignmentIndex !== null ? 'Save Changes' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Customization Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Customize Columns</h2>
            <div className="max-h-96 overflow-y-auto">
              {allColumns.map(col => (
                <div key={col.key} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => handleColumnToggle(col.key)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-2 text-sm text-gray-700">{col.label}</label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handleResetColumns}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;


