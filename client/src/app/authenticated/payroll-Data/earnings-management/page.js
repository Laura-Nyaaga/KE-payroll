"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast"; // Ensure toast is configured/imported correctly for your project
import EarningsTable from "../../../components/payroll/EarningsTable"; // Assuming this path is correct
import EditEarningModal from "../../../components/payroll/EditEarningModal"; // Assuming this path is correct
import PayrollSectionDropdown from '../../../components/common/PayrollSectionDropdown'; // Assuming this path is correct

import {
  downloadCSV,
  downloadPDF,
} from "../../../components/utils/ExportDownloadFormat"; // Assuming this path is correct
import { transformEarningsData } from "../../../components/utils/earningsTransformDownloadData"; // Assuming this path is correct
import {
  fetchEmployeesWithEarnings,
  updateEmployeeEarning,
} from "../../../components/utils/earningsApi"; // Assuming this path is correct
import { FiDownload, FiSettings } from "react-icons/fi"; // Using FiDownload and FiSettings for consistency

export default function EarningsManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEarning, setEditingEarning] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [allEarningsTypes, setAllEarningsTypes] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // Start loading
      setError(null); // Clear any previous errors
      try {
        const data = await fetchEmployeesWithEarnings();
        setEmployees(data);
        const dynamicColumns = {};
        if (data.length > 0) {
          const earningsTypes = new Set();
          data.forEach((employee) => {
            // Defensive check: ensure employeeEarnings and earnings properties exist
            employee.employeeEarnings?.forEach((earning) => {
              if (earning.earnings && earning.earnings.earningsType) {
                earningsTypes.add(earning.earnings.earningsType);
              }
            });
          });
          earningsTypes.forEach((type) => {
            dynamicColumns[type] = true;
          });
          setAllEarningsTypes(Array.from(earningsTypes));
        }
        // Ensure static columns are always visible initially
        dynamicColumns.staffNo = true;
        dynamicColumns.name = true;
        dynamicColumns.basicSalary = true;
        // dynamicColumns.earningsType = true; // This might be a summary column, adjust if needed
        dynamicColumns.total = true;
        setVisibleColumns(dynamicColumns);
        setLoading(false);
      } catch (err) {
        console.error('Error loading earnings data:', err);
        setError(err.message || 'Failed to load earnings data. Please try again.');
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleExport = (format) => {
    const transformed = transformEarningsData(employees);

    if (format === "csv") {
      downloadCSV(transformed, 'earnings_data.csv'); // Pass filename
    } else if (format === "pdf") {
      downloadPDF(transformed, 'Earnings Report', 'earnings_data.pdf'); // Pass title and filename
    }

    setShowDropdown(false);
  };

  const filteredEmployees = employees.filter(
    (employee) => {
      // Add defensive checks for null/undefined properties
      const firstName = (employee.firstName || '').toLowerCase();
      const lastName = (employee.lastName || '').toLowerCase();
      const staffNo = (employee.staffNo || '').toLowerCase();
      const searchTermLower = searchTerm.toLowerCase();

      return (
        firstName.includes(searchTermLower) ||
        lastName.includes(searchTermLower) ||
        staffNo.includes(searchTermLower)
      );
    }
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

  const handleSaveEarning = async (earningId, updateData) => {
    setLoading(true); // Show loading while saving
    try {
      await updateEmployeeEarning(earningId, updateData);
      // Re-fetch data to ensure consistency after save
      const updatedData = await fetchEmployeesWithEarnings();
      setEmployees(updatedData);
      toast.success("Earning updated successfully");
      setEditingEarning(null);
      setError(null);
    } catch (err) {
      console.error("Failed to update earning:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update earning";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false); // Hide loading after save attempt
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
        <p className="ml-4 text-lg text-gray-700">Loading Earnings Data...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-900 px-6 py-8 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Management</h2>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Earnings Data</h3> {/* Consistent subheading */}

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
                const data = await fetchEmployeesWithEarnings();
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

      {/* Top section with dropdowns and search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PayrollSectionDropdown current="Earnings" />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            value={searchTerm}
            onChange={handleSearch}
          />
          {/* Customizer Button */}
          <div className="relative group">
            <button
              onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
              title="Customize Columns"
            >
              <FiSettings className="w-5 h-5" />
            </button>
            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
              Customize Columns
            </div>
          </div>
          {/* Download Dropdown Button */}
          <div className="relative group">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
              title="Download Data"
            >
              <FiDownload className="w-5 h-5" />
            </button>
            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
              Download
            </div>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded shadow-lg z-10">
                <button
                  onClick={() => handleExport("pdf")}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column Customizer */}
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
          <p className="ml-4 text-lg text-gray-700">Loading Earnings Data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white" ref={tableRef}>
          <EarningsTable
            employees={currentData}
            onEditEarning={setEditingEarning}
            visibleColumns={visibleColumns}
            earningsTypes={allEarningsTypes}
          />
        </div>
      )}

      {editingEarning && (
        <EditEarningModal
          earning={editingEarning}
          onClose={() => setEditingEarning(null)}
          onSave={handleSaveEarning}
        />
      )}

      {/* Pagination Controls */}
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
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * rowsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * rowsPerPage, filteredEmployees.length)}
              </span>{" "}
              of <span className="font-medium">{filteredEmployees.length}</span>{" "}
              results
            </p>
          </div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label="Pagination"
          >
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              } transition-colors duration-200`}
            >
              &larr; Previous
            </button>
            <div className="flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700">
              Page <span className="font-medium ml-1">{currentPage}</span> of{" "}
              <span className="font-medium ml-1">{totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
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
