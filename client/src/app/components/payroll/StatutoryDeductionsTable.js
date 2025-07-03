// 'use client';
// import { useEffect, useState, useRef } from 'react';
// import api, { BASE_URL } from '../../config/api';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { FiDownload, FiSettings, FiCalendar, FiFilter, FiX } from 'react-icons/fi';
// import PayrollSectionDropdown from '../common/PayrollSectionDropdown';
// import { Button } from '../ui/button';
// import DatePicker from "@/app/authenticated/payroll-data/DatePicker";
// import { useRoleAccess } from '@/app/utils/roleUtils';

// export default function StatutoryDeductionsTable() {
//    const {
//     user,
//     loading: permissionLoading,
//     hasAccess,
//   } = useRoleAccess("PAYROLL");

//   const [data, setData] = useState([]);
//   const [search, setSearch] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const tableRef = useRef(null);
//   const rowsPerPage = 10;

//   // Dropdown states and refs
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
//   const [showDateFilters, setShowDateFilters] = useState(false);
//   const dropdownRef = useRef(null);
//   const columnCustomizerRef = useRef(null);
//   const dateFilterRef = useRef(null);

//   // Date filter state
//   const [dateFilters, setDateFilters] = useState({
//     startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
//     endDate: new Date()
//   });

//   // Column visibility
//   const [visibleColumns, setVisibleColumns] = useState({
//     staffNo: true,
//     employeeName: true,
//     paye: true,
//     nssf: true,
//     shif: true,
//     housingLevy: true,
//     total: true,
//   });

//   // Fetch data with date filtering
//   useEffect(() => {
//     const fetchStatutoryData = async () => {
//       setLoading(true);
//       setError(null);

//       const companyId = localStorage.getItem('companyId');
//       if (!companyId) {
//         setError("Company ID not found in local storage. Please log in.");
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await api.get(`${BASE_URL}/statutory/company`, {
//           params: {
//             companyId: parseInt(companyId),
//             start: dateFilters.startDate.toISOString().split('T')[0],
//             end: dateFilters.endDate.toISOString().split('T')[0],
//           },
//         });
//         setData(response.data);
//       } catch (err) {
//         console.error('Error fetching statutory deductions:', err);
//         setError(err.response?.data?.message || err.message || 'Failed to fetch statutory deductions.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStatutoryData();
//   }, [dateFilters]);

//   // Outside click handler
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setShowDropdown(false);
//       }
//       if (columnCustomizerRef.current && !columnCustomizerRef.current.contains(event.target)) {
//         setShowColumnCustomizer(false);
//       }
//       if (dateFilterRef.current && !dateFilterRef.current.contains(event.target) && 
//           !event.target.closest('[data-date-filter-button]')) {
//         setShowDateFilters(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   // Filter and pagination logic
//   const filteredData = data.filter((item) =>
//     item.employeeName.toLowerCase().includes(search.toLowerCase())
//   );

//   const totalPages = Math.ceil(filteredData.length / rowsPerPage);
//   const currentData = filteredData.slice(
//     (currentPage - 1) * rowsPerPage,
//     currentPage * rowsPerPage
//   );

//   const calculateTotal = (statutory) => {
//     const paye = parseFloat(statutory.paye) || 0;
//     const nssf = parseFloat(statutory.nssf) || 0;
//     const shif = parseFloat(statutory.shif) || 0;
//     const housingLevy = parseFloat(statutory.housingLevy) || 0;
//     return paye + nssf + shif + housingLevy;
//   };

//   // Download functions
//   const downloadCSV = () => {
//     const headers = ['Staff Id', 'Employee Name', 'P.A.Y.E', 'NSSF', 'SHIF', 'Housing Levy', 'Total'];
//     const rows = filteredData.map((item) => [
//       item.staffNo,
//       item.employeeName,
//       item.statutory.paye || 0.0,
//       item.statutory.nssf,
//       item.statutory.shif,
//       item.statutory.housingLevy,
//       calculateTotal(item.statutory).toFixed(2),
//     ]);
//     const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'statutory_deductions.csv';
//     a.click();
//     URL.revokeObjectURL(url);
//     setShowDropdown(false);
//   };

//   const downloadPDF = () => {
//     const doc = new jsPDF();
//     doc.text('Statutory Deductions', 14, 16);
//     autoTable(doc, {
//       startY: 20,
//       head: [['Staff Id', 'Employee Name', 'P.A.Y.E', 'NSSF', 'SHIF', 'Housing Levy', 'Total']],
//       body: filteredData.map((item) => [
//         item.staffNo,
//         item.employeeName,
//         (item.statutory.paye || 0).toLocaleString(),
//         (item.statutory.nssf || 0).toLocaleString(),
//         (item.statutory.shif || 0).toLocaleString(),
//         (item.statutory.housingLevy || 0).toLocaleString(),
//         calculateTotal(item.statutory).toLocaleString(),
//       ]),
//     });
//     doc.save('statutory_deductions.pdf');
//     setShowDropdown(false);
//   };

//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= totalPages) {
//       setCurrentPage(newPage);
//       tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
//     }
//   };

//   const toggleColumnVisibility = (column) => {
//     setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
//   };

//   const handleDateFilterApply = () => {
//     setCurrentPage(1);
//     setShowDateFilters(false);
//   };

//   const handleDateFilterReset = () => {
//     setDateFilters({
//       startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
//       endDate: new Date()
//     });
//     setCurrentPage(1);
//     setShowDateFilters(false);
//   };

'use client';
import { useEffect, useState, useRef } from 'react';
import api, { BASE_URL } from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload, FiSettings, FiCalendar, FiFilter, FiX } from 'react-icons/fi';
import PayrollSectionDropdown from '../common/PayrollSectionDropdown';
import { Button } from '../ui/button';
import DatePicker from "@/app/authenticated/payroll-data/DatePicker";
import { useRoleAccess } from '@/app/utils/roleUtils'; // Ensure this path is correct

export default function StatutoryDeductionsTable() {
  // HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL OF THE FUNCTION COMPONENT
  const {
    user,
    loading: permissionLoading, // `loading` from useRoleAccess
    hasAccess,
  } = useRoleAccess("PAYROLL");

  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true); // Manages loading state for data fetch from API
  const [error, setError] = useState(null);
  const tableRef = useRef(null);
  const rowsPerPage = 10;

  // Dropdown states and refs
  const [showDropdown, setShowDropdown] = useState(false);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [showDateFilters, setShowDateFilters] = useState(false);
  const dropdownRef = useRef(null);
  const columnCustomizerRef = useRef(null);
  const dateFilterRef = useRef(null);

  // Date filter state - Initialize with a functional updater to ensure stable date objects
  const [dateFilters, setDateFilters] = useState(() => ({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  }));

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    staffNo: true,
    employeeName: true,
    paye: true,
    nssf: true,
    shif: true,
    housingLevy: true,
    total: true,
  });

  // Fetch data with date filtering
  useEffect(() => {
    // This effect will only run when permissions are done loading AND access is granted.
    // Or if permissions are done loading and access is denied, it sets loading to false.
    if (permissionLoading) {
      // Still waiting for permission check, do nothing yet regarding data fetch.
      // The `if (permissionLoading)` block below handles the UI.
      return;
    }

    if (!hasAccess) {
      // Permissions checked, and access is denied. Stop loading for this component.
      setLoading(false);
      return; // Do not proceed with data fetch if no access
    }

    // If we reach here, permissionLoading is false, and hasAccess is true.
    const fetchStatutoryData = async () => {
      setLoading(true); // Start internal data loading
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError("Company ID not found in local storage. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`${BASE_URL}/statutory/company`, {
          params: {
            companyId: parseInt(companyId),
            // Ensure dates are converted to ISO strings for API and dependency array
            start: dateFilters.startDate?.toISOString().split('T')[0],
            end: dateFilters.endDate?.toISOString().split('T')[0],
          },
        });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching statutory deductions:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch statutory deductions.');
      } finally {
        setLoading(false); 
      }
    };

    fetchStatutoryData();
  }, [
    permissionLoading, 
    hasAccess,     
    dateFilters.startDate?.toISOString(),
    dateFilters.endDate?.toISOString()    
  ]);


  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (columnCustomizerRef.current && !columnCustomizerRef.current.contains(event.target)) {
        setShowColumnCustomizer(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target) && 
          !event.target.closest('[data-date-filter-button]')) {
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
        <h2 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
        <p className="text-lg text-gray-700 text-center">
          You do not have the permission to view this page.
        </p>
        <p className="text-md text-gray-500 mt-2 text-center">
          Please contact your administrator if you believe this is an error or need access.
        </p>
         <button
          onClick={() => router.push('/authenticated/dashboard')} // Assuming useRouter is available, if not, window.location.href
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button> 
      </div>
    );
  }

  // Filter and pagination logic (only runs if hasAccess is true and component is rendered)
  const filteredData = data.filter((item) =>
    item.employeeName.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const currentData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const calculateTotal = (statutory) => {
    const paye = parseFloat(statutory.paye) || 0;
    const nssf = parseFloat(statutory.nssf) || 0;
    const shif = parseFloat(statutory.shif) || 0;
    const housingLevy = parseFloat(statutory.housingLevy) || 0;
    return paye + nssf + shif + housingLevy;
  };

  // Download functions
  const downloadCSV = () => {
    const headers = ['Staff Id', 'Employee Name', 'P.A.Y.E', 'NSSF', 'SHIF', 'Housing Levy', 'Total'];
    const rows = filteredData.map((item) => [
      item.staffNo,
      item.employeeName,
      item.statutory.paye || 0.0,
      item.statutory.nssf,
      item.statutory.shif,
      item.statutory.housingLevy,
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
    setShowDropdown(false);
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
        (item.statutory.paye || 0).toLocaleString(),
        (item.statutory.nssf || 0).toLocaleString(),
        (item.statutory.shif || 0).toLocaleString(),
        (item.statutory.housingLevy || 0).toLocaleString(),
        calculateTotal(item.statutory).toLocaleString(),
      ]),
    });
    doc.save('statutory_deductions.pdf');
    setShowDropdown(false);
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

  const handleDateFilterApply = () => {
    setCurrentPage(1);
    setShowDateFilters(false);
  };

  const handleDateFilterReset = () => {
    setDateFilters({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    });
    setCurrentPage(1);
    setShowDateFilters(false);
  };


  return (
    <div className="bg-gray-50 text-gray-900 px-6 py-8 min-h-screen rounded-lg shadow-md">
      <h2 className="text-3xl font-extrabold mb-6 border-b pb-3 text-gray-800">Payroll Management</h2>
      <h3 className="text-2xl font-semibold mb-4 text-gray-700">Statutory Deductions</h3>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              const companyId = localStorage.getItem('companyId');
              if (!companyId) {
                setError("Company ID not found. Cannot retry.");
                setLoading(false);
                return;
              }
              api.get(`${BASE_URL}/statutory/company`, {
                params: {
                  companyId: parseInt(companyId),
                  start: dateFilters.startDate.toISOString().split('T')[0],
                  end: dateFilters.endDate.toISOString().split('T')[0],
                },
              })
              .then(response => setData(response.data))
              .catch(err => setError(err.message))
              .finally(() => setLoading(false));
            }}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <PayrollSectionDropdown current="Statutory Deductions" />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 items-center">
          <input
            type="text"
            placeholder="Search For Employee"
            className="px-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
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
                  {dateFilters.startDate.toLocaleDateString()} - {dateFilters.endDate.toLocaleDateString()}
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
                  onClick={downloadPDF}
                  className="block w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 transition-colors duration-150"
                >
                  PDF
                </button>
                <button
                  onClick={downloadCSV}
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
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm" ref={dateFilterRef}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-700">Filter by Date Range</h4>
            <button 
              onClick={() => setShowDateFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <DatePicker
                selected={dateFilters.startDate}
                onChange={(date) => setDateFilters({...dateFilters, startDate: date})}
                className="w-full p-2 border rounded-md"
                placeholderText="Select start date"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <DatePicker
                selected={dateFilters.endDate}
                onChange={(date) => setDateFilters({...dateFilters, endDate: date})}
                className="w-full p-2 border rounded-md"
                placeholderText="Select end date"
                minDate={dateFilters.startDate}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <Button
                onClick={handleDateFilterApply}
                className="flex items-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Apply Filter
              </Button>
              <Button
                onClick={handleDateFilterReset}
                variant="outline"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Column Customizer */}
      {showColumnCustomizer && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
        ref={columnCustomizerRef}
        >
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
                <span className="capitalize text-base">
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="flex justify-center items-center py-10 min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Loading Statutory Deductions...</p>
        </div>
      ) : (
        <div ref={tableRef} className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.staffNo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff No
                  </th>
                )}
                {visibleColumns.employeeName && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                )}
                {visibleColumns.paye && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P.A.Y.E
                  </th>
                )}
                {visibleColumns.nssf && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N.S.S.F
                  </th>
                )}
                {visibleColumns.shif && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.H.I.F
                  </th>
                )}
                {visibleColumns.housingLevy && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Housing Levy
                  </th>
                )}
                {visibleColumns.total && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="px-6 py-4 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr key={item.staffNo} className="hover:bg-gray-50">
                    {visibleColumns.staffNo && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.staffNo}
                      </td>
                    )}
                    {visibleColumns.employeeName && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.employeeName}
                      </td>
                    )}
                    {visibleColumns.paye && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item.statutory.paye || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.nssf && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item.statutory.nssf || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.shif && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item.statutory.shif || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.housingLevy && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(item.statutory.housingLevy || 0).toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.total && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {calculateTotal(item.statutory).toLocaleString()}
                      </td>
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
