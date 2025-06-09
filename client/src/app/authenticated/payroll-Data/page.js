"use client";
import { useState, useEffect, useRef } from "react";
import DownloadDropdown from "@/app/components/payroll/DeductionDownloadDropDown"; 
import DeductionsTable from "@/app/components/payroll/DeductionsTable";
import EditDeductionModal from "@/app/components/payroll/EditDeductionModal";
import { fetchEmployeesWithDeductions } from "@/app/components/utils/deductionsApi";
import PayrollSectionDropdown from "@/app/components/common/PayrollSectionDropdown";
import { FiDownload, FiSettings } from "react-icons/fi"; // Import icons for consistency

export default function PayrollManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // Start loading
      setError(null); // Clear any previous errors
      try {
        const data = await fetchEmployeesWithDeductions();
        setEmployees(data);

        const types = new Set();
        data.forEach((employee) => {
          // Defensive check for nested properties
          employee.employeeDeductions?.forEach((d) => {
            if (d.deduction && d.deduction.deductionType) {
              types.add(d.deduction.deductionType);
            }
          });
        });

        const typeList = Array.from(types);
        setDeductionTypes(typeList);

        const initialColumnState = {
          staffNo: true,
          name: true,
          total: true,
        };
        typeList.forEach((type) => (initialColumnState[type] = true));
        setVisibleColumns(initialColumnState);

        setLoading(false);
      } catch (err) {
        console.error('Error loading payroll data:', err);
        setError(err.message || 'Failed to load payroll data. Please try again.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const filteredEmployees = employees.filter((employee) =>
    // Add defensive checks for null/undefined properties
    `${employee.firstName || ''} ${employee.lastName || ''}`
      .toLowerCase()
    .includes(searchTerm.toLowerCase()) ||
    (employee.staffNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef(null);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const currentData = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Render loading state for initial fetch or subsequent actions
  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Deductions Data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-900 px-6 py-8 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Management</h2>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Deductions Data</h3> {/* Consistent subheading */}

      {/* Error display section */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={async () => {
              // Retry loading data
              setLoading(true);
              setError(null);
              try {
                const data = await fetchEmployeesWithDeductions();
                setEmployees(data);
              } catch (err) {
                setError(err.message || 'Failed to retry loading data.');
              } finally {
                setLoading(false);
              }
            }}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PayrollSectionDropdown current="Deductions" />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            value={searchTerm}
            onChange={handleSearch}
          />
          <DownloadDropdown
            employees={employees}
            deductionTypes={deductionTypes}
            onCustomizeClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
          />
        </div>
      </div>

      {showColumnCustomizer && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <h4 className="font-medium mb-3 text-lg text-gray-700">Customize Columns</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.keys(visibleColumns).map((column) => (
              <label key={column} className="flex items-center space-x-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={visibleColumns[column]}
                  onChange={() => toggleColumnVisibility(column)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="capitalize text-base">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {loading && employees.length === 0 ? (
        <div className="flex justify-center items-center py-10 min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Loading Deductions Data...</p>
        </div>
      ) : (
        <div ref={tableRef} className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
          <DeductionsTable
            employees={currentData}
            onEditDeduction={setEditingDeduction}
            visibleColumns={visibleColumns}
            deductionTypes={deductionTypes}
          />
        </div>
      )}

      {editingDeduction && (
        <EditDeductionModal
          deduction={editingDeduction}
          onClose={() => setEditingDeduction(null)}
          onSave={async () => {
            setLoading(true); // Show loading while saving
            try {
              const data = await fetchEmployeesWithDeductions();
              setEmployees(data);
              setError(null);
            } catch (err) {
              setError(err.message || 'Failed to refresh data after save.');
            } finally {
              setLoading(false); // Hide loading after save attempt
            }
            setEditingDeduction(null); // Close the modal after save/refresh attempt
          }}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-b-lg shadow-sm">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredEmployees.length)}</span> of{' '}
              <span className="font-medium">{filteredEmployees.length}</span> results
            </p>
          </div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
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
              onClick={() => handlePageChange(currentPage + 1)}
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
    </div>
  );
}







