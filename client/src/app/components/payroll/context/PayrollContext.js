"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import api, { BASE_URL } from "@/app/config/api";
import isEqual from "lodash/isEqual";

const PayrollContext = createContext();

export const PayrollProvider = ({ children }) => {
  const router = useRouter();
  const initialCompanyId =
    typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
  const initialUserData =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;

  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [currentUserId, setCurrentUserId] = useState(
    initialUserData ? JSON.parse(initialUserData).id : null
  );
  const [currentUserRole, setCurrentUserRole] = useState(
    initialUserData ? JSON.parse(initialUserData).role : null
  );

  const [selectedStatus, setSelectedStatus] = useState("draft");
  const [payrollDataRaw, setPayrollDataRaw] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [earningsTypes, setEarningsTypes] = useState([]);
  const [deductionsTypes, setDeductionsTypes] = useState([]);
  const [payrollDates, setPayrollDates] = useState({
    from: null,
    to: null,
    totalDays: 0,
  });
  const [paymentDate, setPaymentDate] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [approverId, setApproverId] = useState(null);
  const [processedBy, setProcessedBy] = useState("");
  const [rejectedBy, setRejectedBy] = useState("");
  const [payrollId, setPayrollId] = useState(null);
  const [filters, setFilters] = useState({
    departments: [],
    jobTitles: [],
    projects: [],
    modes: [],
    employmentTypes: [],
  });
  const [noDataMessage, setNoDataMessage] = useState("");
  const [isPreviewGenerated, setIsPreviewGenerated] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);

  

  const isFetchingRef = useRef(false);

  const canApprovePayroll = useMemo(
    () => ["SuperAdmin", "HR", "Accountant"].includes(currentUserRole),
    [currentUserRole]
  );
  const canRejectPayroll = useMemo(() => canApprovePayroll, [canApprovePayroll]);

  const transformPayrollData = useCallback(
    (data) =>
      Array.isArray(data)
        ? data.map((emp) => ({
            ...emp,
            earnings: emp.earnings || [],
            deductions: emp.deductions || [],
            statutory: emp.statutory || {
              nssf: 0,
              shif: 0,
              housingLevy: 0,
              paye: 0,
              total: 0,
            },
            status: emp.status || selectedStatus,
            departmentId: emp.departmentId?.toString(),
            jobTitleId: emp.jobTitleId?.toString(),
            projectId: emp.projectId?.toString(),
            paymentMethod: emp.paymentMethod,
            employmentType: emp.employmentType,
            rejectionReason: emp.rejectionReason || null,
          }))
        : [],
    [selectedStatus]
  );

  const updateEarningsAndDeductions = useCallback((data) => {
    const earningsSet = new Set();
    const deductionsSet = new Set();

    data.forEach((emp) => {
      emp.earnings?.forEach((e) =>
        earningsSet.add(e.name || e.type || "")
      );
      emp.deductions?.forEach((d) =>
        deductionsSet.add(d.name || d.type || "")
      );
    });

    const earningsArr = Array.from(earningsSet).sort();
    const deductionsArr = Array.from(deductionsSet).sort();

    setEarningsTypes((prev) => (isEqual(prev, earningsArr) ? prev : earningsArr));
    setDeductionsTypes((prev) => (isEqual(prev, deductionsArr) ? prev : deductionsArr));

    const newColumns = {
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
      paymentMethod: true,
      ...Object.fromEntries(earningsArr.map((type) => [`earning_${type}`, true])),
      ...Object.fromEntries(deductionsArr.map((type) => [`deduction_${type}`, true])),
    };

    setVisibleColumns((prev) => (isEqual(prev, newColumns) ? prev : newColumns));
  }, []);

  const fetchPayrollStatus = useCallback(async () => {
    if (!companyId || payrollId === null || selectedStatus === null) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setIsLoading(true);
    setQueryError(null);
    setNoDataMessage("");

    try {
      const res = await api.get(
        `${BASE_URL}/payrolls/status/${companyId}/${payrollId}/${selectedStatus}`
      );

      if (res.data?.success && Array.isArray(res.data.data)) {
        const transformed = transformPayrollData(res.data.data);

        setPayrollDataRaw((prev) => (isEqual(prev, transformed) ? prev : transformed));
        updateEarningsAndDeductions(transformed);
        setRejectionReason(res.data.metadata?.rejectionReason || "");
        setIsPreviewGenerated(true);
      } else {
        setNoDataMessage(res.data?.message || "No data available.");
        setPayrollDataRaw([]);
        setIsPreviewGenerated(false);
      }
    } catch (err) {
      setQueryError(err);
      setNoDataMessage(err.message || "Failed to fetch data.");
      setPayrollDataRaw([]);
      setIsPreviewGenerated(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [companyId, payrollId, selectedStatus, transformPayrollData, updateEarningsAndDeductions]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (companyId && payrollId !== null && selectedStatus !== null) {
        fetchPayrollStatus();
      } else {
        setPayrollDataRaw([]);
        setNoDataMessage("Select payroll ID and status to view data.");
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [companyId, selectedStatus, fetchPayrollStatus]);

  const filteredPayrollData = useMemo(() => {
    if (!payrollDataRaw.length) return [];
    return payrollDataRaw.filter((emp) => {
      const matches = (key, values) =>
        !values?.length || values.includes(emp[key]);
      return (
        matches("departmentId", filters.departments) &&
        matches("jobTitleId", filters.jobTitles) &&
        matches("projectId", filters.projects) &&
        matches("paymentMethod", filters.modes) &&
        matches("employmentType", filters.employmentTypes)
      );
    });
  }, [payrollDataRaw, filters]);

  const generatePreview = useCallback(
    async (dates) => {
      if (
        !dates?.payPeriodStartDate ||
        !dates?.payPeriodEndDate ||
        !dates?.paymentDate
      ) {
        toast.error("Please select all date fields");
        return;
      }

      // console.log("These are the dates:", dates);

      setIsLoading(true);
      try {
        const res = await api.post(
          `${BASE_URL}/payrolls/initiate/company/${companyId}`,
          {
            payPeriodStartDate: dates.payPeriodStartDate,
            payPeriodEndDate: dates.payPeriodEndDate,
            paymentDate: dates.paymentDate,
          }
        );

        // console.log("This is the payload:", payPeriodStartDate, payPeriodEndDate, paymentDate);

        if (res.data?.success) {
          const transformed = transformPayrollData(res.data.data);
          setPayrollDataRaw(transformed);
          updateEarningsAndDeductions(transformed);
          setPayrollId(res.data.payrollId || null);
          setIsPreviewGenerated(true);
          setRejectionReason("");
          toast.success("Preview generated");
        } else {
          toast.error(res.data.message || "Preview failed");
        //   setTimeout(() => {
        //   router.push("/authenticated/dashboard");
        // }, 1000);
        }
      } catch (err) {
        toast.error(err.message);
        setQueryError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, transformPayrollData, updateEarningsAndDeductions]
  );

  const submitDraftPayroll = useCallback(
    async (id, approver, employees) => {
      setIsLoading(true);
      try {
        const res = await api.post(`${BASE_URL}/payrolls/${companyId}/submit`, {
          payrollId: id,
          approverId: approver,
          employeeIds: employees,
        });

        if (res.data?.success) {
          toast.success("Submitted for approval");
          setSelectedEmployees(new Set());
          fetchPayrollStatus();
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, fetchPayrollStatus]
  );

  const approvePayroll = useCallback(
    async (id, employees) => {
      setIsLoading(true);
      try {
        const res = await api.post(`${BASE_URL}/payrolls/${companyId}/approve`, {
          payrollId: id,
          processedBy: currentUserId,
          employeeIds: employees,
        });

        if (res.data?.success) {
          toast.success("Payroll approved");
          setSelectedEmployees(new Set());
          setProcessedBy(currentUserId);
          fetchPayrollStatus();
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, currentUserId, fetchPayrollStatus]
  );

  const rejectPayroll = useCallback(
    async (id, employees, reason) => {
      if (!reason?.trim()) {
        toast.error("Provide a rejection reason");
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.post(`${BASE_URL}/payrolls/${companyId}/reject`, {
          payrollId: id,
          rejectedBy: currentUserId,
          employeeIds: employees,
          rejectionReason: reason,
        });

        if (res.data?.success) {
          toast.success("Payroll rejected");
          setSelectedEmployees(new Set());
          setRejectedBy(currentUserId);
          setRejectionReason(reason);
          fetchPayrollStatus();
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, currentUserId, fetchPayrollStatus]
  );

  const resetSelection = useCallback(() => {
    setSelectedEmployees(new Set());
    setApproverId(null);
    setProcessedBy("");
    setRejectedBy("");
    setRejectionReason("");
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
        rejectedBy,
        setRejectedBy,
        selectedEmployees,
        setSelectedEmployees,
        visibleColumns,
        earningsTypes,
        deductionsTypes,
        generatePreview,
        filters,
        setFilters,
        loading: isLoading,
        payrollId,
        setPayrollId,
        resetSelection,
        submitDraftPayroll,
        approvePayroll,
        rejectPayroll,
        noDataMessage,
        isPreviewGenerated,
        errorState: queryError?.message,
        currentUserId,
        currentUserRole,
        canApprovePayroll,
        canRejectPayroll,
        rejectionReason,
        setRejectionReason,
        companyId,
        fetchPayrollData: fetchPayrollStatus,
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
};

export const usePayrollContext = () => useContext(PayrollContext);
