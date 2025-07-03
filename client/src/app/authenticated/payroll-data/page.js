"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import EarningsTable from "@/app/components/payroll/EarningsTable";
import EditEarningModal from "@/app/components/payroll/EditEarningModal";
import PayrollSectionDropdown from "@/app/components/common/PayrollSectionDropdown";
import DatePicker from "./DatePicker";
import { Button } from "@/app/components/ui/button";

import {
  downloadCSV,
  downloadPDF,
} from "@/app/components/utils/ExportDownloadFormat";
import { transformEarningsData } from "@/app/components/utils/earningsTransformDownloadData";
import {
  fetchEmployeesWithEarnings,
  updateEmployeeEarning,
} from "@/app/components/utils/earningsApi";
import { FiDownload, FiSettings, FiCalendar, FiFilter } from "react-icons/fi";
import { useRoleAccess } from "@/app/utils/roleUtils"; // Assuming this is a client hook

export default function EarningsManagementPage() {
  const {
    user,
    loading: permissionLoading,
    hasAccess,
  } = useRoleAccess("PAYROLL");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true); // Manages loading state for data fetch
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEarning, setEditingEarning] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [allEarningsTypes, setAllEarningsTypes] = useState([]);
  const [dateFilters, setDateFilters] = useState({
    startDate: null,
    endDate: null,
  });
  const [showDateFilters, setShowDateFilters] = useState(false);

  // Refs for outside click detection
  const dropdownRef = useRef(null);
  const columnCustomizerRef = useRef(null);
  const dateFilterRef = useRef(null);

  const tableRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async (startDate = null, endDate = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Loading data with dates:", { startDate, endDate });

      const data = await fetchEmployeesWithEarnings(startDate, endDate);

      console.log("Received data:", data);
      console.log("Is data an array?", Array.isArray(data));

      const employeesArray = Array.isArray(data) ? data : [];

      setEmployees(employeesArray);
      const dynamicColumns = {};

      if (employeesArray.length > 0) {
        const earningsTypes = new Set();

        employeesArray.forEach((employee) => {
          const earnings = employee.employeeEarnings || [];

          earnings.forEach((earning) => {
            if (earning && earning.earnings && earning.earnings.earningsType) {
              earningsTypes.add(earning.earnings.earningsType);
            }
          });
        });

        earningsTypes.forEach((type) => {
          dynamicColumns[type] = true;
        });

        setAllEarningsTypes(Array.from(earningsTypes));
      } else {
        setAllEarningsTypes([]);
      }

      // Default columns
      dynamicColumns.staffNo = true;
      dynamicColumns.name = true;
      dynamicColumns.basicSalary = true;
      dynamicColumns.grossPay = true;

      setVisibleColumns(dynamicColumns);
    } catch (err) {
      console.error("Error loading earnings data:", err);

      const errorMessage =
        err.message || "Failed to load earnings data. Please try again.";
      setError(errorMessage);
      setEmployees([]);
      setAllEarningsTypes([]);
      setVisibleColumns({
        staffNo: true,
        name: true,
        basicSalary: true,
        grossPay: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        columnCustomizerRef.current &&
        !columnCustomizerRef.current.contains(event.target)
      ) {
        setShowColumnCustomizer(false);
      }
      if (
        dateFilterRef.current &&
        !dateFilterRef.current.contains(event.target) &&
        !event.target.closest("[data-date-filter-button]")
      ) {
        // Check if click is not on the button that opens it
        setShowDateFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (permissionLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Verifying permissions...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gray-100 p-4">
        <h2 className="text-3xl font-bold text-red-600 mb-4">
          Unauthorized Access
        </h2>
        <p className="text-lg text-gray-700 text-center">
          You do not have the permission to view this page.
        </p>
        <p className="text-md text-gray-500 mt-2 text-center">
          Please contact your administrator if you believe this is an error or
          need access.
        </p>
        <button
          onClick={() => router.push("/authenticated/dashboard")}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Earnings Data...</p>
      </div>
    );
  }

  const handleDateFilterApply = () => {
    loadData(dateFilters.startDate, dateFilters.endDate);
    setShowDateFilters(false);
  };

  const handleDateFilterReset = () => {
    setDateFilters({ startDate: null, endDate: null });
    loadData();
    setShowDateFilters(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleExport = (format) => {
    const transformed = transformEarningsData(employees);

    if (format === "csv") {
      downloadCSV(transformed, "earnings_data.csv");
    } else if (format === "pdf") {
      downloadPDF(transformed, "Earnings Report", "earnings_data.pdf");
    }

    setShowDropdown(false);
  };

  const filteredEmployees = employees.filter((employee) => {
    const firstName = (employee.firstName || "").toLowerCase();
    const lastName = (employee.lastName || "").toLowerCase();
    const staffNo = (employee.staffNo || "").toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    return (
      firstName.includes(searchTermLower) ||
      lastName.includes(searchTermLower) ||
      staffNo.includes(searchTermLower)
    );
  });

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
    setLoading(true);
    try {
      await updateEmployeeEarning(earningId, updateData);
      await loadData(dateFilters.startDate, dateFilters.endDate);
      toast.success("Earning updated successfully");
      setEditingEarning(null);
      setError(null);
    } catch (err) {
      console.error("Failed to update earning:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update earning";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

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
      <h2 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">
        Payroll Management
      </h2>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">
        Gross Pay Data
      </h3>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await loadData();
              } catch (err) {
                setError(err.message || "Failed to retry loading data.");
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
        <PayrollSectionDropdown current="Gross Pay" />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            value={searchTerm}
            onChange={handleSearch}
          />

          {/* Date Filter Button */}
          <div ref={dateFilterRef}>
            <Button
              onClick={() => setShowDateFilters(!showDateFilters)}
              variant="outline"
              className="flex items-center gap-2"
              data-date-filter-button
            >
              <FiCalendar className="w-4 h-4" />
              {dateFilters.startDate || dateFilters.endDate ? (
                <span className="text-sm">
                  {dateFilters.startDate?.toLocaleDateString() || "Any"} -{" "}
                  {dateFilters.endDate?.toLocaleDateString() || "Any"}
                </span>
              ) : (
                <span>Date Filter</span>
              )}
            </Button>
          </div>

          {/* Customizer Button */}
          <div className="relative" ref={columnCustomizerRef}>
            <button
              onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
              title="Customize Columns"
            >
              <FiSettings className="w-5 h-5" />
            </button>
          </div>

          {/* Download Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
              title="Download Data"
            >
              <FiDownload className="w-5 h-5" />
            </button>
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

      {/* Date Filter Panel */}
      {showDateFilters && (
        <div
          className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          ref={dateFilterRef}
        >
          {" "}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                selected={dateFilters.startDate}
                onChange={(date) =>
                  setDateFilters({ ...dateFilters, startDate: date })
                }
                className="w-full p-2 border rounded-md"
                placeholderText="Select start date"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                selected={dateFilters.endDate}
                onChange={(date) =>
                  setDateFilters({ ...dateFilters, endDate: date })
                }
                className="w-full p-2 border rounded-md"
                placeholderText="Select end date"
                minDate={dateFilters.startDate}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleDateFilterApply}
                disabled={!dateFilters.startDate && !dateFilters.endDate}
                className="flex items-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Apply Filter
              </Button>
              <Button onClick={handleDateFilterReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>
          {(dateFilters.startDate || dateFilters.endDate) && (
            <div className="mt-3 text-sm text-gray-600">
              Showing data for:{" "}
              {dateFilters.startDate?.toLocaleDateString() || "Any start date"}{" "}
              to {dateFilters.endDate?.toLocaleDateString() || "Any end date"}
            </div>
          )}
        </div>
      )}

      {/* Column Customizer */}
      {showColumnCustomizer && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
        ref={columnCustomizerRef}
        >
          <h4 className="font-medium mb-3 text-lg text-gray-700">
            Customize Columns
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.keys(visibleColumns).map((column) => (
              <label
                key={column}
                className="flex items-center space-x-2 text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[column]}
                  onChange={() => toggleColumnVisibility(column)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="capitalize text-base">
                  {column.replace(/([A-Z])/g, " $1").trim()}
                </span>
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
        <div
          className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white"
          ref={tableRef}
        >
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
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:bg-gray-50"
              } transition-colors duration-200`}
            >
              Next &rarr;
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
