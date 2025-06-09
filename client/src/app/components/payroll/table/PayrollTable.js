"use client";
import { useState, useEffect, useRef } from "react";
import PayrollRow from "./PayrollRow";
import LoadingSpinner from "../../common/LoadingSpinner";
import PayrollStatusBar from "../status/PayrollStatusBar";
import PayrollToolbar from "../PayrollToolbar";
import PayrollFilters from "../filters/PayrollFilters";
import { exportPayrollToCSV, exportPayrollToPDF } from "../../utils/exportPayroll";
import ApproverSelect from "../submission/ApproverSelect"; // This component's visibility will be controlled
import RefreshPayrollButton from "../submission/RefreshPayrollButton";
import { usePayrollContext } from "../context/PayrollContext";
import toast from "react-hot-toast";

export default function PayrollTable() {
  const {
    payrollData,
    selectedStatus,
    setSelectedStatus,
    payrollDates,
    setPayrollDates,
    paymentDate,
    setPaymentDate,
    approverId,
    setApproverId,
    processedBy,
    setProcessedBy, // This will be set automatically for approval
    selectedEmployees,
    setSelectedEmployees,
    visibleColumns,
    setVisibleColumns,
    earningsTypes,
    deductionsTypes,
    loading,
    fetchReadOnlyStatus,
    payrollId,
    submitDraftPayroll,
    approvePayroll, // This function now handles 'processedBy' internally
    filters,
    currentUserId, // From context
    currentUserRole, // From context
    canApprovePayroll, // From context
    errorState // From context (for general error display)
  } = usePayrollContext();

  const [showCustomizer, setShowCustomizer] = useState(false);
  const customizerPanelRef = useRef(null);
  const customizeButtonRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false); // For local button loading states
  const rowsPerPage = 10;

  // Removed hardcoded companyId: const companyId = 3;

  // Derive selectedPaymentMethod from filters.modes
  const selectedPaymentMethod = filters.modes.length === 1 ? filters.modes[0] : null;

  const displayedPayrollData = payrollData || []; // Ensure it's never undefined before checks

  const totalPages = Math.ceil(displayedPayrollData.length / rowsPerPage);
  const paginatedData = displayedPayrollData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  // --- END DERIVED STATE AND VARIABLES ---


  // --- 3. ALL USEEFFECTS (which are hooks) ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // fetchReadOnlyStatus now handles getting companyId internally
        await fetchReadOnlyStatus(selectedStatus, payrollId);
      } catch (error) {
        console.error("Error loading payroll data in PayrollTable:", error);
        // Error toast/message is already handled by PayrollContext's fetchReadOnlyStatus
      }
    };

    loadData();
  }, [selectedStatus, payrollId, fetchReadOnlyStatus]); // Removed companyId from dependencies

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  // useEffect for handling click outside of the customizer panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showCustomizer &&
        customizerPanelRef.current && !customizerPanelRef.current.contains(event.target) &&
        customizeButtonRef.current && !customizeButtonRef.current.contains(event.target)
      ) {
        setShowCustomizer(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomizer]);

  // Display global error from context if available
  if (errorState && !loading) { // Only show global error if not currently loading
    return (
      <div className="text-center py-8 px-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
        <p className="font-medium">Error: {errorState}</p>
        <button
          onClick={() => fetchReadOnlyStatus(selectedStatus, payrollId)} // Retry with current status and payrollId
          className="mt-3 bg-red-200 text-red-800 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
        >
          Retry Loading Data
        </button>
      </div>
    );
  }

  // Display initial loading spinner if no data and loading
  if (loading && !displayedPayrollData.length) {
    return <LoadingSpinner />;
  }

  const getPaginationInfo = () => {
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, displayedPayrollData.length);
    return `Showing ${start} to ${end} of ${displayedPayrollData.length} results`;
  };

  const handleSelectEmployee = (employeeId) => {
    const updated = new Set(selectedEmployees);
    updated.has(employeeId)
      ? updated.delete(employeeId)
      : updated.add(employeeId);
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

    // Replace browser confirm with a custom modal if needed for production
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
    // processedBy is now automatically handled by PayrollContext
    if (selectedEmployees.size === 0) {
        toast.error("Please select at least one employee.");
        return;
    }

    // Replace browser confirm with a custom modal if needed for production
    if (!confirm(`Are you sure you want to approve ${selectedEmployees.size} selected employees?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
        // approvePayroll function in context now takes care of processedBy and permissions
        const success = await approvePayroll(
            payrollId,
            Array.from(selectedEmployees) // Only pass payrollId and employeeIds
        );

        if (success) {
            setProcessedBy(""); // Clear processor state if successful
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCustomizeToggle = () => {
    setShowCustomizer(prev => !prev);
  };
  // --- END EVENT HANDLERS AND OTHER FUNCTIONS ---

  return (
    <div className="p-4 bg-gray-50 text-gray-900 min-h-screen rounded-lg shadow-md"> {/* Added styling */}
      <h1 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Data</h1> {/* Added styling */}

      <PayrollFilters
        payrollDates={payrollDates}
        paymentDate={paymentDate}
        setPayrollDates={setPayrollDates}
        setPaymentDate={setPaymentDate}
        approverId={approverId}
      />

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
              dataToExport = payrollData.filter(emp => selectedEmployees.has(emp.employeeId));
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
          ref={customizeButtonRef} // Pass the ref for the button
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
                <span className="capitalize text-base">{column.replace(/([A-Z])/g, ' $1').trim()}</span> 
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
                        {type.replace(/([A-Z])/g, ' $1').trim()} {/* Humanize earning type */}
                      </th>
                    )
                )}
                {deductionsTypes.map(
                  (type, idx) =>
                    visibleColumns[`deduction_${type}`] && (
                      <th key={`deduction-${idx}`} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">
                        {type.replace(/([A-Z])/g, ' $1').trim()} {/* Humanize deduction type */}
                      </th>
                    )
                )}
                {visibleColumns.totalEarnings && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Total Earnings</th>
                )}
                {visibleColumns.totalDeductions && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Total Deductions</th>
                )}
                {visibleColumns.grossPay && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Gross Pay</th>
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
                {visibleColumns.paye && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">PAYE</th>
                )}
                {visibleColumns.totalStatutory && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Total Statutory</th>
                )}
                {visibleColumns.netPay && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Net Pay</th>
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={Object.keys(visibleColumns).filter(col => visibleColumns[col]).length + 1} className="px-6 py-8 text-center text-gray-500 text-lg border-t border-gray-200">
                    No payroll data found for the current filters or status.
                  </td>
                </tr>
              ) : (
                paginatedData.map((emp, index) => (
                  <PayrollRow
                    key={emp.employeeId || index} // Fallback to index if employeeId is missing
                    employee={emp}
                    earningsTypes={earningsTypes}
                    deductionsTypes={deductionsTypes}
                    selected={selectedEmployees.has(emp.employeeId)}
                    onSelect={() => handleSelectEmployee(emp.employeeId)}
                    visibleColumns={visibleColumns}
                    // Apply even/odd row shading and hover effect to rows directly
                    className={index % 2 === 0 ? 'bg-gray-50 hover:bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              } transition-colors duration-200`}
            >
              &larr; Previous
            </button>
            <div className="flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page <span className="font-medium ml-1">{currentPage}</span> of{' '}
              <span className="font-medium ml-1">{totalPages}</span>
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              } transition-colors duration-200`}
            >
              Next &rarr;
            </button>
          </nav>
        </div>
      </div>

      {(selectedStatus === "draft" || selectedStatus === "pending") && (
        <div className="mt-4 flex gap-8 items-center"> 
          {selectedStatus === "draft" && ( 
            // Only show ApproverSelect for 'draft'
            <ApproverSelect onApproverChange={setApproverId} />
          )}

          {selectedStatus === "draft" && (
            <button
              onClick={handleDraftSubmit}
              disabled={isSubmitting || loading || selectedEmployees.size === 0 || !approverId || !payrollId}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-[200px] mt-2" 
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : "Submit for Approval"}
            </button>
          )}

          {selectedStatus === "pending" && (
            <button
              onClick={handleApprove}
              // Disabled if submitting, global loading, no employees selected, no payrollId, or user cannot approve
              disabled={isSubmitting || loading || selectedEmployees.size === 0 || !payrollId || !canApprovePayroll()}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 w-[200px] mt-2" 
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : "Approve Payroll"}
            </button>
          )}
        </div>
      )}

      {(selectedStatus === "expired" || selectedStatus === "rejected") && (
        <RefreshPayrollButton />
      )}
    </div>
  );
}
