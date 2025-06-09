'use client';
import { useEffect, useState, useRef } from 'react';
import api, { BASE_URL } from '../../config/api'; // Adjusted path to match your project structure
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiSettings } from 'react-icons/fi';
import PayrollSectionDropdown from '../common/PayrollSectionDropdown';

export default function StatutoryDeductionsTable() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    staffNo: true,
    employeeName: true,
    paye: true,
    nssf: true,
    shif: true,
    housingLevy: true,
    total: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = useRef(null);
  const rowsPerPage = 10;

  // New state for dynamic start and end dates
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]); // Format as YYYY-MM-DD

  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null); // Added error state

  useEffect(() => {
    const fetchStatutoryData = async () => {
      setLoading(true); // Set loading true before fetching
      setError(null); // Clear previous errors

      const companyId = localStorage.getItem('companyId'); // Dynamically get companyId

      if (!companyId) {
        setError("Company ID not found in local storage. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`${BASE_URL}/statutory/company`, {
          params: {
            companyId: parseInt(companyId), // Ensure companyId is parsed as an integer
            start: startDate,
            end: endDate,
          },
        });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching statutory deductions:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch statutory deductions.');
      } finally {
        setLoading(false); // Set loading false after fetching
      }
    };

    fetchStatutoryData();
  }, [startDate, endDate]); // Re-fetch data when startDate or endDate changes

  const filteredData = data.filter((item) =>
    item.employeeName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const calculateTotal = (statutory) => {
    // Ensure all properties are numbers before summing
    const paye = parseFloat(statutory.paye) || 0;
    const nssf = parseFloat(statutory.nssf) || 0;
    const shif = parseFloat(statutory.shif) || 0;
    const housingLevy = parseFloat(statutory.housingLevy) || 0;
    return paye + nssf + shif + housingLevy;
  };

  const downloadCSV = () => {
    const headers = ['Staff Id', 'Employee Name', 'P.A.Y.E', 'NSSF', 'SHIF', 'Housing Levy', 'Total'];
    const rows = filteredData.map((item) => [
      item.staffNo,
      item.employeeName,
      item.statutory.paye || 0.0,
      item.statutory.nssf,
      item.statutory.shif,
      item.statutory.housingLevy,
      // Use calculateTotal for CSV to ensure consistency if 'total' isn't directly in item.statutory
      calculateTotal(item.statutory).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'statutory_deductions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Statutory Deductions', 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [['Staff Id', 'Employee Name', 'P.A.Y.E', 'NSSF', 'SHIF', 'Housing Levy', 'Total']],
      body: filteredData.map((item) => [
        item.staffNo,
        item.employeeName,
        (item.statutory.paye || 0).toLocaleString(), // Ensure 0 if null/undefined
        (item.statutory.nssf || 0).toLocaleString(),
        (item.statutory.shif || 0).toLocaleString(),
        (item.statutory.housingLevy || 0).toLocaleString(),
        calculateTotal(item.statutory).toLocaleString(), // Use calculateTotal for PDF
      ]),
    });
    doc.save('statutory_deductions.pdf');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleColumnVisibility = (column) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <div className="bg-gray-50 text-gray-900 px-6 py-8 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Management</h2>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Statutory Deductions</h3>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PayrollSectionDropdown current="Taxes" />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
          {/* Start Date Picker */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1); // Reset to first page on date change
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            title="Start Date"
          />
          {/* End Date Picker */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1); // Reset to first page on date change
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            title="End Date"
          />
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <div className="relative group">
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
              title="Customize Columns"
            >
              <FiSettings className="w-5 h-5" />
            </button>
            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
              Customize Columns
            </div>
          </div>
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
                  onClick={() => { downloadPDF(); setShowDropdown(false); }}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  PDF
                </button>
                <button
                  onClick={() => { downloadCSV(); setShowDropdown(false); }}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCustomizer && (
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

      {loading ? (
        <div className="flex justify-center items-center py-10 min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Loading Statutory Deductions...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 px-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
          <p className="font-medium">Error: {error}</p>
          <button
            onClick={() => {
                const retryLoadData = async () => {
                    setLoading(true);
                    setError(null);
                    const companyId = localStorage.getItem('companyId');
                    if (!companyId) {
                      setError("Company ID not found. Cannot retry.");
                      setLoading(false);
                      return;
                    }
                    try {
                        const response = await api.get(`${BASE_URL}/statutory/company`, {
                            params: {
                                companyId: parseInt(companyId),
                                start: startDate,
                                end: endDate,
                            },
                        });
                        setData(response.data);
                    } catch (err) {
                        console.error('Error retrying fetch:', err);
                        setError(err.response?.data?.message || err.message || 'Failed to retry fetching data.');
                    } finally {
                        setLoading(false);
                    }
                };
                retryLoadData();
            }}
            className="mt-3 bg-red-200 text-red-800 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry Loading Data
          </button>
        </div>
      ) : (
        <div ref={tableRef} className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {visibleColumns.staffNo && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Staff No</th>}
                {visibleColumns.employeeName && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Employee Name</th>}
                {visibleColumns.paye && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">P.A.Y.E</th>}
                {visibleColumns.nssf && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">N.S.S.F</th>}
                {visibleColumns.shif && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">S.H.I.F</th>}
                {visibleColumns.housingLevy && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r border-gray-200 last:border-r-0">Housing Levy</th>}
                {visibleColumns.total && <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-r-0">Total</th>} {/* last:border-r-0 for the last column */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentData.length === 0 ? (
                <tr key="no-data-found">
                  <td colSpan={Object.keys(visibleColumns).filter(col => visibleColumns[col]).length} className="px-6 py-8 text-center text-gray-500 text-lg border-t border-gray-200">
                    No statutory deductions found for the selected period or search criteria.
                  </td>
                </tr>
              ) : (
                currentData.map((employee, index) => (
                  // Apply even/odd row shading and hover effect
                  <tr key={employee.staffNo || index} className="even:bg-gray-100 odd:bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                    {visibleColumns.staffNo && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap border-r border-gray-200 last:border-r-0">{employee.staffNo}</td>
                    )}
                    {visibleColumns.employeeName && (
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap border-r border-gray-200 last:border-r-0">{employee.employeeName}</td>
                    )}
                    {visibleColumns.paye && (
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700 border-r border-gray-200 last:border-r-0">{(employee.statutory.paye || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.nssf && (
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700 border-r border-gray-200 last:border-r-0">{(employee.statutory.nssf || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.shif && (
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700 border-r border-gray-200 last:border-r-0">{(employee.statutory.shif || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.housingLevy && (
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-700 border-r border-gray-200 last:border-r-0">{(employee.statutory.housingLevy || 0).toLocaleString()}</td>
                    )}
                    {visibleColumns.total && (
                      <td className="px-6 py-4 text-sm font-bold whitespace-nowrap border-r-0">{calculateTotal(employee.statutory).toLocaleString()}</td> 
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of{' '}
              <span className="font-medium">{filteredData.length}</span> results
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