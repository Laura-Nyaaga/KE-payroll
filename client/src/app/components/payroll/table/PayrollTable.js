"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import PayrollRow from "./PayrollRow";
import LoadingSpinner from "../../common/LoadingSpinner";
import PayrollStatusBar from "../status/PayrollStatusBar";
import PayrollToolbar from "../PayrollToolbar";
import { exportPayrollToCSV, exportPayrollToPDF } from "../../utils/exportPayroll";
import ApproverSelect from "../submission/ApproverSelect";
import RefreshPayrollButton from "../submission/RefreshPayrollButton";
import { usePayrollContext } from "../context/PayrollContext";
import toast from "react-hot-toast";
import PayrollFilters from "../filters/PayrollFilters";

export default function PayrollTable() {
  const {
    payrollData,
    selectedStatus,
    setSelectedStatus,
    payrollDates,
    paymentDate,
    approverId,
    setApproverId,
    processedBy,
    setProcessedBy,
    rejectedBy,
    setRejectedBy,
    selectedEmployees,
    setSelectedEmployees,
    visibleColumns,
    setVisibleColumns,
    earningsTypes,
    deductionsTypes,
    loading,
    payrollId,
    submitDraftPayroll,
    approvePayroll,
    rejectPayroll,
    filters,
    currentUserId,
    currentUserRole,
    canApprovePayroll,
    canRejectPayroll,
    rejectionReason,
    setRejectionReason,
    errorState,
    fetchPayrollData,
  } = usePayrollContext();

  const [showCustomizer, setShowCustomizer] = useState(false);
  const customizerPanelRef = useRef(null);
  const customizeButtonRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rowsPerPage = 10;

  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [currentPayrollAction, setCurrentPayrollAction] = useState({ payrollId: null, employeeIds: [] });

  const selectedPaymentMethod = filters.modes.length === 1 ? filters.modes[0] : null;
  
const displayedPayrollData = useMemo(() => {
  console.log("Filtering payroll data", {
    rawData: payrollData,
    filters,
    selectedStatus
  });
  
  if (!payrollData || payrollData.length === 0) return [];
  
  return payrollData.filter((emp) => {
    const departmentMatch = !filters.departments?.length || 
      filters.departments.includes(emp.departmentId);
    const jobTitleMatch = !filters.jobTitles?.length || 
      filters.jobTitles.includes(emp.jobTitleId);
    const projectMatch = !filters.projects?.length || 
      filters.projects.includes(emp.projectId);
    const modeMatch = !filters.modes?.length || 
      filters.modes.includes(emp.paymentMethod);
    const employmentTypeMatch = !filters.employmentTypes?.length || 
      filters.employmentTypes.includes(emp.employmentType);

    return departmentMatch && jobTitleMatch && projectMatch && 
           modeMatch && employmentTypeMatch;
  });
}, [payrollData, filters]);// Simplify to use payrollData directly


  const totalPages = Math.ceil(displayedPayrollData.length / rowsPerPage);
  const paginatedData = displayedPayrollData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    if (payrollId && selectedStatus) {
      fetchPayrollData();
      console.log("Fetching data for payrollId:", payrollId, "status:", selectedStatus);
    }
  }, [selectedStatus, payrollId, fetchPayrollData]);

   useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, payrollId]);

  // Add this near the top of your component
useEffect(() => {
  console.log("Current status changed:", selectedStatus);
  if (payrollId) {
    fetchPayrollData();
  }
}, [selectedStatus, payrollId, fetchPayrollData]);

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showCustomizer &&
        customizerPanelRef.current &&
        !customizerPanelRef.current.contains(event.target) &&
        customizeButtonRef.current &&
        !customizeButtonRef.current.contains(event.target)
      ) {
        setShowCustomizer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomizer]);

  const getPaginationInfo = () => {
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, displayedPayrollData.length);
    return `Showing ${start} to ${end} of ${displayedPayrollData.length} results`;
  };

  const handleSelectEmployee = (employeeId) => {
    const updated = new Set(selectedEmployees);
    updated.has(employeeId) ? updated.delete(employeeId) : updated.add(employeeId);
    setSelectedEmployees(updated);
  };

  const areAllSelected = () =>
    paginatedData.length > 0 &&
    paginatedData.every((emp) => selectedEmployees.has(emp.employeeId));

  const handleDraftSubmit = async () => {
    if (!approverId) {
      toast.error("Please select an approver.");
      return;
    }
    if (selectedEmployees.size === 0) {
      toast.error("Please select at least one employee.");
      return;
    }
    if (!payrollId) {
      toast.error("No payroll ID found. Please select a payroll date range.");
      return;
    }
    if (!confirm(`Are you sure you want to submit ${selectedEmployees.size} selected employees for approval?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await submitDraftPayroll(
        payrollId,
        approverId,
        Array.from(selectedEmployees)
      );
      if (success) {
        setApproverId(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (selectedEmployees.size === 0) {
      toast.error("Please select at least one employee.");
      return;
    }
    if (!payrollId) {
      toast.error("No payroll ID found. Please select a payroll date range.");
      return;
    }
    if (!confirm(`Are you sure you want to approve ${selectedEmployees.size} selected employees?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const success = await approvePayroll(payrollId, Array.from(selectedEmployees));
      if (success) {
        setProcessedBy("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = () => {
    if (selectedEmployees.size === 0) {
      toast.error("Please select at least one employee to reject.");
      return;
    }
    if (!payrollId) {
      toast.error("No payroll ID found. Please select a payroll date range.");
      return;
    }
    setCurrentPayrollAction({
      payrollId: payrollId,
      employeeIds: Array.from(selectedEmployees),
    });
    setRejectionReasonInput("");
    setShowRejectionModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReasonInput.trim()) {
      toast.error("Rejection reason is required. Please provide a descriptive reason.");
      return;
    }

    if (!confirm(`Are you sure you want to reject ${currentPayrollAction.employeeIds.length} selected employees?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await rejectPayroll(
        currentPayrollAction.payrollId,
        currentPayrollAction.employeeIds,
        rejectionReasonInput
      );   
        setRejectedBy("");
        setShowRejectionModal(false);
        setRejectionReasonInput("");
        setCurrentPayrollAction({ payrollId: null, employeeIds: [] });
        setRejectionReason(rejectionReasonInput); 
        toast.success("Payroll rejected successfully.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomizeToggle = () => {
    setShowCustomizer((prev) => !prev);
  };

  if (loading) {
  console.log("Currently loading data...");
  return <LoadingSpinner />;
}

if (errorState) {
  console.log("Error state:", errorState);
  return <div className="text-red-500 p-4">Error: {errorState}</div>;
}

if (displayedPayrollData.length === 0) {
  console.log("No data to display, checking why...", {
    rawData: payrollData,
    filters,
    selectedStatus,
    payrollId
  });
}

  // At the top of your component, before the return statement
console.log("Rendering PayrollTable with data:", {
  payrollData,
  loading,
  errorState,
  selectedStatus,
  payrollId,
  filteredCount: displayedPayrollData.length
});

  return (
    <div className="p-4 bg-gray-50 text-gray-900 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Data</h1>

   {/* <div className="p-4 bg-gray-100 mb-4 rounded-lg">
  <h3 className="font-bold mb-2">Debug Info</h3>
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <p><strong>Current Status:</strong> {selectedStatus}</p>
      <p><strong>Payroll ID:</strong> {payrollId || 'None'}</p>
      <p><strong>Data Count:</strong> {payrollData?.length || 0}</p>
    </div>
    <div>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>Error:</strong> {errorState || 'None'}</p>
    </div>
  </div>
</div> */}

      <PayrollFilters />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PayrollStatusBar
          payrollData={displayedPayrollData}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
        <PayrollToolbar
          onExport={(type) => {
            let dataToExport = [];
            if (selectedEmployees.size > 0) {
              dataToExport = payrollData.filter((emp) => selectedEmployees.has(emp.employeeId));
            } else {
              dataToExport = displayedPayrollData;
            }

            if (dataToExport.length === 0) {
              toast.error("No data to export. Select employees or ensure payroll data exists.");
              return;
            }

            if (type === "csv")
              exportPayrollToCSV(
                dataToExport,
                visibleColumns,
                earningsTypes,
                deductionsTypes,
                selectedStatus,
                selectedPaymentMethod
              );
            else if (type === "pdf")
              exportPayrollToPDF(
                dataToExport,
                visibleColumns,
                earningsTypes,
                deductionsTypes,
                selectedStatus,
                selectedPaymentMethod
              );
            else if (type === "payslip") {
              if (dataToExport.length === 1) {
                toast.success("Generating payslip for " + dataToExport[0].fullName);
                console.log("Payslip generation triggered for:", dataToExport[0]);
              } else if (dataToExport.length > 1) {
                toast.error("Please select only one employee to generate a single payslip.");
              } else {
                toast.error("No employee selected for payslip.");
              }
            }
          }}
          onCustomize={handleCustomizeToggle}
          isCustomizerOpen={showCustomizer}
          ref={customizeButtonRef}
        />
      </div>

      {showCustomizer && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm" ref={customizerPanelRef}>
          <h4 className="font-medium mb-3 text-lg text-gray-700">Customize Columns</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.keys(visibleColumns).map((column) => (
              <label key={column} className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={visibleColumns[column]}
                  onChange={(e) => {
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [column]: !prev[column],
                    }));
                  }}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="capitalize text-base">{column.replace(/([A-Z])/g, " $1").trim()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
        <div className="overflow-y-scroll scroll-smooth max-h-[550px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">
                  <input
                    type="checkbox"
                    checked={areAllSelected()}
                    onChange={() => {
                      const newSet = areAllSelected()
                        ? new Set()
                        : new Set(paginatedData.map((emp) => emp.employeeId));
                      setSelectedEmployees(newSet);
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                </th>
                {visibleColumns.staffId && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Staff ID</th>
                )}
                {visibleColumns.fullName && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Employee Name</th>
                )}
                {visibleColumns.basicSalary && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Basic Salary</th>
                )}
                {earningsTypes.map(
                  (type, idx) =>
                    visibleColumns[`earning_${type}`] && (
                      <th key={`earning-${idx}`} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">
                        {type.replace(/([A-Z])/g, " $1").trim()}
                      </th>
                    )
                )}
                {visibleColumns.grossPay && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Gross Pay</th>
                )}
                {visibleColumns.paye && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">PAYE</th>
                )}
                {visibleColumns.nssf && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">NSSF</th>
                )}
                {visibleColumns.shif && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">SHIF</th>
                )}
                {visibleColumns.housingLevy && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Housing Levy</th>
                )}
                {visibleColumns.totalStatutory && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Total Statutory Deductions</th>
                )}
                {deductionsTypes.map(
                  (type, idx) =>
                    visibleColumns[`deduction_${type}`] && (
                      <th key={`deduction-${idx}`} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">
                        {type.replace(/([A-Z])/g, " $1").trim()}
                      </th>
                    )
                )}
                {visibleColumns.totalDeductions && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Total Deductions</th>
                )}
                {visibleColumns.netPay && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r-0">Net Pay</th>
                )}
                {visibleColumns.paymentMethod && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r-0">Payment Method</th>
                )}
                {visibleColumns.status && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r-0">Status</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((emp, index) => (
                <PayrollRow
                  key={emp.employeeId || index}
                  employee={emp}
                  earningsTypes={earningsTypes}
                  deductionsTypes={deductionsTypes}
                  selected={selectedEmployees.has(emp.employeeId)}
                  onSelect={() => handleSelectEmployee(emp.employeeId)}
                  visibleColumns={visibleColumns}
                  className={index % 2 === 0 ? "bg-gray-50 hover:bg-gray-200" : "bg-gray-100 hover:bg-gray-200"}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-center">
          <LoadingSpinner />
        </div>
      )}

      {!loading && displayedPayrollData.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg shadow-sm">
          No existing payroll data in {selectedStatus} status.
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-b-lg shadow-sm">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">{getPaginationInfo()}</p>
          </div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
              } transition-colors duration-200`}
            >
              ← Previous
            </button>
            <div className="flex items-center px-4 py-2 border-t border-b border-gray-200 bg-white text-sm font-medium text-gray-700">
              Page <span className="font-medium ml-1">{currentPage}</span> of{" "}
              <span className="font-medium ml-1">{totalPages}</span>
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:bg-gray-50"
              } transition-colors duration-200`}
            >
              Next →
            </button>
          </nav>
        </div>
      </div>

      {(selectedStatus === "draft" || selectedStatus === "pending") && (
        <div className="mt-4 flex gap-8 items-center">
          {selectedStatus === "draft" && <ApproverSelect onApproverChange={setApproverId} />}

          {selectedStatus === "draft" && (
            <button
              onClick={handleDraftSubmit}
              disabled={isSubmitting || loading || selectedEmployees.size === 0 || !approverId || !payrollId}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-[200px] mt-2"
            >
              {isSubmitting ? <LoadingSpinner /> : "Submit for Approval"}
            </button>
          )}
          <div className="gap-20 flex items-center">
            {selectedStatus === "pending" && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting || loading || selectedEmployees.size === 0 || !payrollId || !canApprovePayroll}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-[200px] mt-2"
              >
                {isSubmitting ? <LoadingSpinner size="medium" /> : "Approve Payroll"}
              </button>
            )}

            {selectedStatus === "pending" && (
              <button
                onClick={handleRejectClick}
                disabled={isSubmitting || loading || selectedEmployees.size === 0 || !payrollId || !canRejectPayroll}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 rounded-md shadow-sm py-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 w-[200px] mt-2"
              >
                {isSubmitting ? <LoadingSpinner size="medium" /> : "Reject Payroll"}
              </button>
            )}
          </div>
        </div>
      )}

      {selectedStatus === "rejected" && rejectionReason && payrollData.length > 0 && (
  <div className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg shadow-sm">
    <h3 className="text-xl font-bold mb-4 flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 mr-2 text-yellow-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      Payroll Rejected
    </h3>
    <p className="text-gray-700">
      <span className="font-semibold">Reason for Rejection:</span> {rejectionReason}
    </p>
  </div>
)}

      {(selectedStatus === "expired" || selectedStatus === "rejected") && 
      <RefreshPayrollButton />}

      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto relative">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Provide Rejection Reason</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a clear and descriptive reason for rejecting the selected payroll entries.
            </p>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4 text-gray-700"
              rows="5"
              placeholder="e.g., Missing timesheets for Employee X, incorrect salary for Department Y."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>{ setShowRejectionModal(false);
                  setRejectionReasonInput("");
                }
                }
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReasonInput.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isSubmitting ? <LoadingSpinner size="small" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


