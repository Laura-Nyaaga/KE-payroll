"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api, { BASE_URL } from "@/app/config/api"; // Updated import: Assuming 'api' is your configured axios instance with 'withCredentials: true'

const PayrollContext = createContext();

export const PayrollProvider = ({ children }) => {
  // State initialization
  const [selectedStatus, setSelectedStatus] = useState("draft");
  const [payrollDataRaw, setPayrollDataRaw] = useState([]);
  const [filteredPayrollData, setFilteredPayrollData] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [earningsTypes, setEarningsTypes] = useState([]);
  const [deductionsTypes, setDeductionsTypes] = useState([]);
  const [payrollDates, setPayrollDates] = useState({
    from: null,
    to: null,
    totalDays: 0
  });
  const [paymentDate, setPaymentDate] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [approverId, setApproverId] = useState(null);
  const [processedBy, setProcessedBy] = useState("");
  const [payrollId, setPayrollId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    departments: [],
    jobTitles: [],
    projects: [],
    modes: [],
    employmentTypes: []
  });
  const [noDataMessage, setNoDataMessage] = useState("");
  const [isPreviewGenerated, setIsPreviewGenerated] = useState(false);

  // New states for current user details
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  // Derived state for approval permission (Memoized for performance)
  const canApprovePayroll = useCallback(() => {
    return ['SuperAdmin', 'HR', 'Accountant'].includes(currentUserRole);
  }, [currentUserRole]);


  // Fetch current user details from local storage on mount
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('user'); // Assuming user data is stored here as 'user'
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        setCurrentUserId(user.id); // Assuming user.id holds the userId
        setCurrentUserRole(user.role); // Assuming user.role holds the user's role
      }
    } catch (e) {
      console.error("Failed to parse user data from local storage:", e);
      setCurrentUserId(null);
      setCurrentUserRole(null);
    }
  }, []); // Run once on component mount

  const transformPayrollData = useCallback((data) => {
    return data.map(emp => ({
      ...emp,
      earnings: emp.earnings || [],
      deductions: emp.deductions || [],
      statutory: emp.statutory || {
        nssf: 0,
        shif: 0,
        housingLevy: 0,
        paye: 0,
        total: 0
      },
      status: emp.status || selectedStatus,
      // Ensure IDs are strings for consistent comparison with filter arrays
      departmentId: emp.departmentId?.toString(),
      jobTitleId: emp.jobTitleId?.toString(),
      projectId: emp.projectId?.toString(),
      paymentMethod: emp.paymentMethod,
      employmentType: emp.employmentType
    }));
  }, [selectedStatus]);

  const updateEarningsAndDeductions = useCallback((data) => {
    const earnings = new Set();
    const deductions = new Set();

    data.forEach(emp => {
      // Use optional chaining and nullish coalescing to safely access properties
      emp.earnings?.forEach(e => earnings.add(e.name || e.type || ''));
      emp.deductions?.forEach(d => deductions.add(d.name || d.type || ''));
    });

    const earningsArr = Array.from(earnings);
    const deductionsArr = Array.from(deductions);

    setEarningsTypes(earningsArr);
    setDeductionsTypes(deductionsArr);

    const columns = {
      staffId: true,
      fullName: true,
      basicSalary: true,
      totalEarnings: true,
      totalDeductions: true,
      grossPay: true,
      nssf: true,
      shif: true,
      housingLevy: true,
      paye: true,
      totalStatutory: true,
      netPay: true,
      status: true,
    };

    earningsArr.forEach(type => columns[`earning_${type}`] = true);
    deductionsArr.forEach(type => columns[`deduction_${type}`] = true);
    setVisibleColumns(columns);
  }, []);

  const fetchReadOnlyStatus = useCallback(async (status, specificPayrollId = null) => {
    setLoading(true);
    setError(null);
    const companyId = localStorage.getItem('companyId');

    if (!companyId) {
      setLoading(false);
      setError("Company ID not found in local storage. Cannot fetch payroll data.");
      setNoDataMessage("Company ID not found. Please log in.");
      return;
    }

    try {
      const payrollIdToUse = specificPayrollId || payrollId;
      const response = await api.get( // Use 'api' instance
        `${BASE_URL}/payrolls/status/${companyId}/${payrollIdToUse}/${status}` // Dynamic companyId
      );

      if (response.data?.success) {
        const transformedData = transformPayrollData(response.data.data);
        setPayrollDataRaw(transformedData);
        updateEarningsAndDeductions(transformedData);
        setPayrollId(response.data.payrollId || payrollId);
        setNoDataMessage("");
      } else {
        setPayrollDataRaw([]);
        updateEarningsAndDeductions([]);
        setNoDataMessage(`No payroll Data exists in ${status}`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setPayrollDataRaw([]);
      updateEarningsAndDeductions([]);
      setError(err.response?.data?.message || err.message || `Failed to load ${status} payroll.`); // Use setError
      setNoDataMessage(`Failed to load ${status} payroll. ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [payrollId, transformPayrollData, updateEarningsAndDeductions]);

  // Initial fetch on component mount and when selectedStatus changes
  useEffect(() => {
    fetchReadOnlyStatus(selectedStatus); // Pass selectedStatus to fetch function
  }, [selectedStatus, fetchReadOnlyStatus]);

  const generatePreview = useCallback(async (dates) => {
    if (!dates?.payPeriodStartDate || !dates?.payPeriodEndDate || !dates?.paymentDate) {
      toast.error("Please select all date fields");
      throw new Error("Missing date fields");
    }

    setLoading(true);
    setError(null);
    const companyId = localStorage.getItem('companyId');

    if (!companyId) {
      setLoading(false);
      setError("Company ID not found in local storage. Cannot generate preview.");
      toast.error("Company ID not found. Please log in.");
      throw new Error("Company ID missing");
    }

    try {
      // Ensure dates are Date objects or convert them
      const startDate = new Date(dates.payPeriodStartDate);
      const endDate = new Date(dates.payPeriodEndDate);
      const paymentDate = new Date(dates.paymentDate);

      const payload = {
        payPeriodStartDate: startDate.toISOString().split('T')[0],
        payPeriodEndDate: endDate.toISOString().split('T')[0],
        paymentDate: paymentDate.toISOString().split('T')[0],
      };

      console.log("API Payload:", payload);

      const response = await api.post( // Use 'api' instance
        `${BASE_URL}/payrolls/initiate/company/${companyId}`, // Dynamic companyId
        payload
      );

      if (response.data?.success) {
        const transformedData = transformPayrollData(response.data.data);
        setPayrollDataRaw(transformedData);
        updateEarningsAndDeductions(transformedData);
        setPayrollId(response.data.payrollId || null); // Ensure payrollId is correctly set
        toast.success("Draft payroll generated");
        setIsPreviewGenerated(true);
        setNoDataMessage("");
        return response.data;
      }
      throw new Error(response.data?.message || "Failed to generate preview");
    } catch (err) {
      console.error("Generate preview error:", err);
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
      }
      const errorMessage = err.response?.data?.message || err.message || "Failed to generate preview";
      toast.error(errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [transformPayrollData, updateEarningsAndDeductions]);

  const submitDraftPayroll = useCallback(async (submitPayrollId, submitApproverId, submitEmployeeIds) => {
    setLoading(true);
    setError(null);
    const companyId = localStorage.getItem('companyId');

    if (!companyId) {
      setLoading(false);
      setError("Company ID not found in local storage. Cannot submit payroll.");
      toast.error("Company ID not found. Please log in.");
      return false;
    }

    try {
      const response = await api.post( // Use 'api' instance
        `${BASE_URL}/payrolls/${companyId}/submit`, // Dynamic companyId
        {
          payrollId: submitPayrollId,
          approverId: submitApproverId,
          employeeIds: submitEmployeeIds
        }
      );

      if (response.data?.success) {
        toast.success(response.data.message || "Payroll submitted for approval");
        setSelectedEmployees(new Set());
        // Re-fetch read-only status for the *current* selected status after submission
        await fetchReadOnlyStatus(selectedStatus, response.data.payrollId || submitPayrollId); // Use response.data.payrollId if available
        return true;
      } else {
        const errorMessage = response.data.message || "Failed to submit payroll";
        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Error submitting payroll", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit payroll";
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchReadOnlyStatus, selectedStatus]);

  const approvePayroll = useCallback(async (approvePayrollId, approveEmployeeIds) => {
    setLoading(true);
    setError(null);
    const companyId = localStorage.getItem('companyId');

    if (!companyId) {
      setLoading(false);
      setError("Company ID not found in local storage. Cannot approve payroll.");
      toast.error("Company ID not found. Please log in.");
      return false;
    }
    // Check if currentUserId is available
    if (!currentUserId) {
        setLoading(false);
        setError("Current user ID not available. Cannot approve payroll.");
        toast.error("User not logged in or user data missing from local storage.");
        return false;
    }
    // Check if the current user has the required role to approve using the memoized function
    if (!canApprovePayroll()) { // Call canApprovePayroll as a function
        setLoading(false);
        setError("You do not have the required role (SuperAdmin, HR, Accountant) to approve payroll.");
        toast.error("Insufficient permissions to approve payroll.");
        return false;
    }


    try {
      // Use the current user's ID for processedBy directly
      const response = await api.post(
        `${BASE_URL}/payrolls/${companyId}/approve`,
        {
          payrollId: approvePayrollId,
          processedBy: currentUserId, // Automatically set to current user's ID
          employeeIds: approveEmployeeIds
        }
      );

      if (response.data?.success) {
        toast.success(response.data.message || "Payroll approved");
        setSelectedEmployees(new Set());
        setProcessedBy(currentUserId); // Update context state with the processor's ID
        await fetchReadOnlyStatus(selectedStatus, response.data.payrollId || approvePayrollId);
        return true;
      } else {
        const errorMessage = response.data.message || "Failed to approve payroll";
        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error("Error approving payroll", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to approve payroll";
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchReadOnlyStatus, selectedStatus, currentUserId, canApprovePayroll]); // Added currentUserId and canApprovePayroll to dependencies

  useEffect(() => {
    if (!payrollDataRaw) {
      setFilteredPayrollData([]);
      return;
    }
    const filteredData = payrollDataRaw.filter((emp) => {
      // Use optional chaining and nullish coalescing to handle potential null/undefined IDs
      const departmentMatch =
        !filters?.departments?.length || filters.departments.includes(emp.departmentId);
      const jobTitleMatch =
        !filters?.jobTitles?.length || filters.filters.departments.includes(emp.departmentId); // Fix: Corrected filter here, was filters.filters.departments
      const projectMatch =
        !filters?.projects?.length || filters.projects.includes(emp.projectId);
      const modeMatch =
        !filters?.modes?.length || filters.modes.includes(emp.paymentMethod);
      const employmentTypeMatch =
        !filters?.employmentTypes?.length || filters.employmentTypes.includes(emp.employmentType);

      return (
        departmentMatch &&
        jobTitleMatch &&
        projectMatch &&
        modeMatch &&
        employmentTypeMatch
      );
    });
    setFilteredPayrollData(filteredData);
  }, [payrollDataRaw, filters]);

  const resetSelection = useCallback(() => {
    setSelectedEmployees(new Set());
    setApproverId(null);
    setProcessedBy("");
  }, []);

  return (
    <PayrollContext.Provider
      value={{
        selectedStatus,
        setSelectedStatus,
        payrollData: filteredPayrollData,
        setPayrollData: setPayrollDataRaw,
        payrollDates,
        setPayrollDates,
        paymentDate,
        setPaymentDate,
        approverId,
        setApproverId,
        processedBy,
        setProcessedBy,
        selectedEmployees,
        setSelectedEmployees,
        visibleColumns,
        setVisibleColumns,
        earningsTypes,
        deductionsTypes,
        generatePreview,
        fetchReadOnlyStatus,
        filters,
        setFilters,
        loading,
        payrollId,
        setPayrollId,
        resetSelection,
        submitDraftPayroll,
        approvePayroll,
        noDataMessage,
        isPreviewGenerated,
        errorState: error,
        currentUserId, // Expose currentUserId
        currentUserRole, // Expose currentUserRole
        canApprovePayroll // Expose approval permission (now a function)
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayrollContext = () => useContext(PayrollContext);



