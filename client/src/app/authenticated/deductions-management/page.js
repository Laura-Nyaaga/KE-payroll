"use client";
import { useState, useEffect, useRef } from "react";
import DownloadDropdown from "../components/payroll/DeductionDownloadDropDown";
import DeductionsTable from "../components/payroll/DeductionsTable";
import EditDeductionModal from "../components/payroll/EditDeductionModal";
import { fetchEmployeesWithDeductions } from "../components/utils/deductionsApi";
import PayrollSectionDropdown from '../components/common/PayrollSectionDropdown'; 
export default function PayrollManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({});
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const companyId = 3;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchEmployeesWithDeductions(companyId);
        setEmployees(data);

        const types = new Set();
        data.forEach((employee) => {
          employee.employeeDeductions.forEach((d) => {
            types.add(d.deduction.deductionType);
          });
        });

        const typeList = Array.from(types);
        setDeductionTypes(typeList);

        const columnState = {
          staffNo: true,
          name: true,
          total: true,
        };
        typeList.forEach((type) => (columnState[type] = true));
        setVisibleColumns(columnState);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredEmployees = employees.filter((employee) =>
    `${employee.firstName} ${employee.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    employee.staffNo.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="bg-white text-black px-6">
      <h2 className="text-2xl font-bold mb-6">Payroll Management</h2>
      <h3 className="text-xl font-semibold mb-4">Payroll Data</h3>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <PayrollSectionDropdown current="Deductions" />        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border rounded-md w-full sm:w-64"
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
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-2">Customize Columns</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Object.keys(visibleColumns).map((column) => (
              <label key={column} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={visibleColumns[column]}
                  onChange={() => toggleColumnVisibility(column)}
                  className="rounded text-blue-600"
                />
                <span className="capitalize">{column}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error: {error}</div>
      ) : (
        <div ref={tableRef} className="overflow-x-auto">
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
          onSave={() => {
            fetchEmployeesWithDeductions(companyId)
              .then((data) => setEmployees(data))
              .catch((err) => setError(err.message));
          }}
        />
      )}

      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4">
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
              }`}
            >
              &larr; Previous
            </button>
            <div className="flex items-center px-4">
              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </span>
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Next &rarr;
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}









