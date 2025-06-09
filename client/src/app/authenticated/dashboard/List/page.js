'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { BASE_URL } from '@/app/config/api'; // Ensure BASE_URL is imported from your api config

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employmentTypes] = useState(['Permanent','Full-time','Regular','Contract' ,'Internship', 'Probationary', 'Part-Time', 'Casual']);
  const [paymentMethods] = useState(['Bank', 'Cash', 'Check', 'Mobile Money']);
  const [employeeStatuses] = useState(['Active', 'Inactive']);
  const [managers, setManagers] = useState([]);
  const [fetchRetries, setFetchRetries] = useState(0);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [jobTitles, setJobTitles] = useState([]);
  const [jobGroups] = useState([
    { id: 1, name: 'G1' },
    { id: 2, name: 'G2' },
    { id: 3, name: 'G3' },
    { id: 4, name: 'G4' },
    { id: 5, name: 'G5' }
  ]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: '' // 'success' or 'error'
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const tableRef = useRef(null); // Ref to scroll to top of table on page change


  // Derived state for pagination
  const totalPages = Math.ceil(employees.length / rowsPerPage);
  const paginatedEmployees = employees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );


  useEffect(() => {
    console.log('Current employees:', employees.map(e => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      jobGroupId: e.jobGroupId,
      jobGroup: e.jobGroup
    })));
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchManagers();
    fetchJobTitles();
  }, [fetchRetries]); // Added fetchRetries to dependencies

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      // Handle potential missing BASE_URL
      if (!BASE_URL) {
        console.warn('BASE_URL is not defined. Check your configuration.');
        setError('API configuration error. Please contact support.');
        setLoading(false);
        return;
      }
      try {
        const companyId = localStorage.getItem('companyId');
        // Ensure companyId exists for the request
        if (!companyId) {
          setError('Company ID not found in local storage. Please log in.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/employees/company/${companyId}`, {
          credentials: 'include', // Ensure cookies are sent
          signal: AbortSignal.timeout(10000)
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch employees: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.error('Request timed out:', err);
          setError('Request timed out. Check your connection and try again.');
        } else {
          console.error('Failed to fetch employees:', err);
          setError('Failed to load employees. Please check your connection and try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      if (!BASE_URL) {
        console.warn('BASE_URL is not defined. Check your configuration.');
        return;
      }
      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          console.warn('Company ID not found in local storage for departments.');
          return; // Skip fetch if no companyId
        }
        const res = await fetch(`${BASE_URL}/departments/companies/${companyId}`, {
          credentials: 'include', // Ensure cookies are sent
          signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch departments: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        // Non-blocking error - we can still show employees even if departments fail to load
      }
    } catch (err) {
      console.error('Error in fetchDepartments:', err);
    }
  };

  const fetchJobTitles = async () => {
    try {
      if (!BASE_URL) {
        console.warn('BASE_URL is not defined. Check your configuration.');
        return;
      }
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.warn('Company ID not found in local storage for job titles.');
        return; // Skip fetch if no companyId
      }
      const res = await fetch(`${BASE_URL}/job-titles/companies/${companyId}`, {
        credentials: 'include', // Ensure cookies are sent
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch job titles: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setJobTitles(data);
    } catch (err) {
      console.error('Failed to fetch job titles:', err);
    }
  };

  const fetchManagers = async () => {
    try {
      if (!BASE_URL) {
        console.warn('BASE_URL is not defined. Check your configuration.');
        return;
      }
      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          console.warn('Company ID not found in local storage for managers.');
          return; // Skip fetch if no companyId
        }
        // We'll fetch all employees from the same company to get potential managers
        const res = await fetch(`${BASE_URL}/employees/company/${companyId}`, { // Filter managers by companyId
          credentials: 'include', // Ensure cookies are sent
          signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch managers: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setManagers(data);
      } catch (err) {
        console.error('Failed to fetch managers:', err);
      }
    } catch (err) {
      console.error('Error in fetchManagers:', err);
    }
  };

  const handleEditClick = (employee) => {
    const currentJobGroup = employee.jobGroup?.id
      ? jobGroups.find(g => g.id === employee.jobGroup.id)
      : employee.jobGroupId
        ? jobGroups.find(g => g.id === employee.jobGroupId)
        : null;

    setEditingEmployee({
      ...employee,
      jobGroupId: currentJobGroup?.id || employee.jobGroupId || employee.jobGroup || '',
      jobGroup: currentJobGroup || employee.jobGroup || null
    });
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setEditingEmployee(null);
    setShowEditModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'departmentId') {
      const selectedDept = departments.find(dept => dept.id === parseInt(value) || dept.id === value);
      setEditingEmployee(prev => ({
        ...prev,
        departmentId: parseInt(value) || value,
        department: {
          id: parseInt(value) || value,
          title: selectedDept?.title || ''
        }
      }));
    } else if (name === 'jobGroupId') {
      const selectedJobGroup = jobGroups.find(group =>
        group.id === parseInt(value) || group.id === value
      );
      setEditingEmployee(prev => ({
        ...prev,
        jobGroupId: value,
        jobGroup: selectedJobGroup || null

      }));

    } else if (name === 'jobTitleId') {
      const selectedTitle = jobTitles.find(title => title.id === parseInt(value) || title.id === value);
      setEditingEmployee(prev => ({
        ...prev,
        jobTitleId: parseInt(value) || value,
        jobTitle: selectedTitle || null
      }));
    } else if (name === 'reportingToId') {
      const selectedManager = managers.find(manager => manager.id === parseInt(value) || manager.id === value);
      setEditingEmployee(prev => ({
        ...prev,
        reportingToId: parseInt(value) || value,
        reportingTo: selectedManager ? {
          id: selectedManager.id,
          firstName: selectedManager.firstName,
          lastName: selectedManager.lastName
        } : null
      }));
    } else if (name === 'basicSalary') {
      setEditingEmployee(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else {
      setEditingEmployee(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (!editingEmployee || !editingEmployee.id) {
        throw new Error('Invalid employee data');
      }
      const payload = {
        id: editingEmployee.id,
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        workEmail: editingEmployee.workEmail,
        departmentId: editingEmployee.departmentId || (editingEmployee.department ? editingEmployee.department.id : null),
        employmentType: editingEmployee.employmentType,
        basicSalary: parseFloat(editingEmployee.basicSalary) || 0,
        jobTitleId: editingEmployee.jobTitleId || (editingEmployee.jobTitle ? editingEmployee.jobTitle.id : null),
        jobGroupId: editingEmployee.jobGroupId || editingEmployee.jobGroup?.id || null,
        reportingToId: editingEmployee.reportingToId || null,
        status: editingEmployee.status
      };
      console.log('Sending update with payload:', payload);
      const res = await fetch(`${BASE_URL}/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'credentials': 'include' // Ensure cookies are sent with PUT request
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Failed to update employee: ${res.status} ${JSON.stringify(errorData)}`);
      }
      // Get the updated employee from the response
      const updatedEmployee = await res.json();
      // Update local state
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.id === editingEmployee.id ? {
            ...emp,
            ...updatedEmployee,
            jobGroup: jobGroups.find(g => g.id === updatedEmployee.jobGroupId) || null
          } : emp
        )
      );
      // Close modal
      setShowEditModal(false);
      setEditingEmployee(null);
    setNotification({
      show: true,
      message: 'Employee updated successfully',
      type: 'success'
    });
    // Auto-hide the notification after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);

  } catch (err) {
    console.error('Error updating employee:', err);

    // Show error in notification instead of alert
    setNotification({
      show: true,
      message: `Failed to update employee: ${err.message || 'Unknown error'}. Please try again.`,
      type: 'error'
    });
    // Auto-hide the error notification after 5 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);

  } finally {
    setUpdateLoading(false);
  }
  };

  const handleRetry = () => {
    setFetchRetries(prev => prev + 1);
  };

  // Pagination Handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to the top of the table when page changes
      tableRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 min-h-[400px]"> {/* Added min-height */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading employees...</p>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-lg shadow-md text-center"> {/* Added text-center */}
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Error Loading Employees</h2>
          <p className="text-gray-700">{error}</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
          <Link href="/authenticated/dashboard" className="block text-center text-blue-500 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">

      <div className="flex justify-between mb-4">

      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-md flex items-center ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification({ show: false, message: '', type: '' })}
            className="ml-4 text-gray-500 hover:text-gray-700"
            aria-label="Close notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link href="/authenticated/dashboard/addEmployee">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            Add New Employee
          </button>
        </Link>
      </div>
      <div ref={tableRef} className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-md">
      <table className="w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Job Title
              </th>
              {/* <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Job Group
              </th> */}
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Reports To
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Employment Type
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {`${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {employee.workEmail || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {employee.department?.title || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {employee.jobTitle?.name|| 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {employee.reportsTo ?
                      `${employee.reportsTo.firstName || ''} ${employee.reportsTo.lastName || ''}`.trim() :
                      'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    {employee.employmentType || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${employee.paymentMethod?.toLowerCase() === 'mobilemoney' ? 'bg-purple-100 text-purple-800' :
                          employee.paymentMethod?.toLowerCase() === 'bank' ? 'bg-blue-100 text-blue-800' :
                          employee.paymentMethod?.toLowerCase() === 'cash' ? 'bg-pink-100 text-pink-800' :
                          employee.paymentMethod?.toLowerCase() === 'cheque' || employee.paymentMethod?.toLowerCase() === 'check' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {employee.paymentMethod ? (
                          employee.paymentMethod.toLowerCase() === 'mobilemoney' ? 'Mobile Money' :
                          employee.paymentMethod.toLowerCase() === 'bank' ? 'Bank' :
                          employee.paymentMethod.toLowerCase() === 'cash' ? 'Cash' :
                          employee.paymentMethod.toLowerCase() === 'cheque' || employee.paymentMethod?.toLowerCase() === 'check' ? 'Cheque' :
                          employee.paymentMethod
                        ) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                      {employee.basicSalary !== undefined ?
                        `${employee.currency || 'KES'} ${parseFloat(employee.basicSalary).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}` :
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 text-right">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${employee.status === 'Active' ? 'bg-green-100 text-green-800' :
                          (employee.status === 'Inactive' || !employee.status) ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {employee.status || 'Inactive'}
                      </span>
                    </td>
                  <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditClick(employee)}
                        className="p-1.5 text-blue-500 rounded hover:bg-blue-100 transition-colors"
                        aria-label="Edit employee"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.828 15.172a2 2 0 01-.586.586l-4 1a1 1 0 01-1.171-1.171l1-4a2 2 0 01.586-.586L17.414 2.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="px-6 py-10 text-center border-b border-gray-200 text-gray-500">
                  No employees found. Click "Add New Employee" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, employees.length)} of {employees.length} results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="border-b px-6 py-3 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
              <button
                onClick={handleCloseEdit}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
                disabled={updateLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6">
              {/* Employee ID - Hidden field to ensure the ID is included */}
              <input type="hidden" name="id" value={editingEmployee.id || ''} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editingEmployee.firstName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={updateLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editingEmployee.lastName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={updateLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    name="workEmail"
                    value={editingEmployee.workEmail || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={updateLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    name="departmentId"
                    value={editingEmployee.departmentId || editingEmployee.department?.id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updateLoading}
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.length > 0 ? (
                      departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.title}
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading departments...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <select
                    name="jobTitleId"
                    value={editingEmployee.jobTitleId || editingEmployee.jobTitle?.id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updateLoading}
                  >
                    <option value="" disabled>Select Job Title</option>
                    {jobTitles.length > 0 ? (
                      jobTitles.map(title => (
                        <option key={title.id} value={title.id}>
                          {title.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Loading job titles...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                  <select
                    name="reportingToId"
                    value={editingEmployee.reportingToId || editingEmployee.reportingTo?.id || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updateLoading}
                  >
                    <option value="" disabled>Select Manager</option>
                    {managers.length > 0 ? (
                      managers
                        .filter(manager => manager.id !== editingEmployee.id)
                        .map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {`${manager.firstName} ${manager.lastName}`}
                          </option>
                        ))
                    ) : (
                      <option disabled>Loading managers...</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    name="employmentType"
                    value={editingEmployee.employmentType || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updateLoading}
                  >
                    <option value="" disabled>Select Employment Type</option>
                    {employmentTypes.map(type => (
                      <option
                       key={type} value={type} >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={editingEmployee.paymentMethod || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={updateLoading}
                  >
                    <option value="" disabled>Select Payment Method</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (KES)</label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={editingEmployee.basicSalary || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                    disabled={updateLoading}
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={editingEmployee.status || 'Inactive'}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={updateLoading}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center ${updateLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
