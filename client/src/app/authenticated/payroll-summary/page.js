"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../config/api";
import { useRoleAccess } from "@/app/utils/roleUtils";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollSummary() {
  const { user, loading: permissionLoading, hasAccess } = useRoleAccess("PAYROLL");
  const [payrollData, setPayrollData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState("");
  const [companyId, setCompanyId] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("companyId");
    setCompanyId(storedCompanyId);
  }, []);

  useEffect(() => {
    if (companyId) fetchPayrollSummary();
  }, [companyId, yearFilter]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); 
  }, [payrollData, monthFilter]);

 const fetchPayrollSummary = async () => {
  try {
    const res = await api.get(`/payrolls/companies/${companyId}/summary`, {
      params: { year: yearFilter },
    });
    setPayrollData(res.data.data || []);
    setApiError(null); 
  } catch (error) {
    console.error("Error fetching payroll summary:", error);
    if (error.response && error.response.status === 404 || 500) {
      setPayrollData([]);
      setApiError(`No payroll data found for the year ${yearFilter}.`);
    } 
    if (error.response && error.response.status === 400) {
      setPayrollData([]);
      setApiError("Invalid request. Please try again.");
    } 
    else {
      setApiError("An unexpected error occurred while fetching payroll data.");
    }
  }
};


  const applyFilters = () => {
    let data = [...payrollData];
    if (monthFilter) {
      data = data.filter((item) =>
        item.month.toLowerCase().includes(monthFilter.toLowerCase())
      );
    }
    setFilteredData(data);
  };

  const handleRowClick = (payrollId) => {
    router.push(`/authenticated/payroll-summary/batch/${companyId}/${payrollId}`);
  };

  const handleClearFilters = () => {
    setMonthFilter("");
    setYearFilter(new Date().getFullYear());
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <button
          onClick={() => router.push("/authenticated/dashboard")}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

if (apiError) {
  return (
    <div className="p-6 bg-yellow-100 text-yellow-800 rounded-md m-6">
      <h2 className="text-xl font-semibold">Notice</h2>
      <p>{apiError}</p>
    </div>
  );
}

if (payrollData.length > 0 && filteredData.length === 0) {
  return (
    <div className="p-6 bg-blue-100 text-blue-800 rounded-md m-6">
      <h2 className="text-xl font-semibold">No Filtered Results</h2>
      <p>
        No payroll data available for <strong>{monthFilter || "selected filters"}</strong> in{" "}
        <strong>{yearFilter}</strong>.
      </p>
      <button
        onClick={handleClearFilters}
        className="mt-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
      >
        Clear Filters
      </button>
    </div>
  );
}


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Payroll Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          className="border p-2 w-1/2"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="">All Months</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={applyFilters}
        >
          Search
        </button>

        <button
          className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          onClick={handleClearFilters}
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2 w-20">No.</th>
              <th className="border p-2 w-[400px]">Month</th>
              <th className="border p-2 w-[300px]">No. of Payslips</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, idx) => (
              <tr
                key={item.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(item.id)}
              >
                <td className="border p-2 text-center">
                  {(currentPage - 1) * itemsPerPage + idx + 1}
                </td>
                <td className="border p-2">{item.month}, {item.year}</td>
                <td className="border p-2">{item.noOfEmployees}</td>
              </tr>
            ))}

            {filteredData.length > 0 && (
              <tr className="font-bold bg-gray-100">
                <td className="border p-2">Total</td>
                <td className="border p-2">{filteredData.length}</td>
                <td className="border p-2">
                  {filteredData.reduce((sum, p) => sum + p.noOfEmployees, 0)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className={`px-4 py-2 rounded ${
            currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage)}
        </span>
        <button
          disabled={currentPage >= Math.ceil(filteredData.length / itemsPerPage)}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className={`px-4 py-2 rounded ${
            currentPage >= Math.ceil(filteredData.length / itemsPerPage)
              ? "bg-gray-300"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}




