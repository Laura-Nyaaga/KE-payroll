"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "../../../../../config/api";
import PayslipModal from "../../payslips";

export default function PayrollBatchDetails() {
  const { companyId, payrollId } = useParams();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchBatchDetails();
  }, [payrollId]);

  const fetchBatchDetails = async () => {
    try {
      const response = await api.get(
        `/payrolls/batch/${companyId}/${payrollId}/employee-details`
      );
      setEmployees(response.data.employees);
      setSelectedEmployees([]);
    } catch (error) {
      console.error("Error fetching batch details:", error);
    }
  };

  const handleCheckboxChange = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.employeeId));
    }
  };

  const handleViewClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleCloseModal = () => {
    setSelectedEmployeeId(null);
  };

  const handleSearch = (e) => {
    setSearchEmployee(e.target.value);
    setCurrentPage(1); 
  };

  const handleClearSearch = () => {
    setSearchEmployee("");
    setCurrentPage(1); 
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(searchEmployee.toLowerCase())
  );

  const handleEmailPayslips = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee.");
      return;
    }
    setIsLoading(true);
    try {
      await api.post(`/payrolls/email-payslips/${companyId}`, {
        employeeIds: selectedEmployees,
        payrollId,
      });
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
        setIsLoading(false);
        fetchBatchDetails();
      }, 2000);
    } catch (error) {
      console.error("Error emailing payslips:", error);
      setIsLoading(false);
      alert("Failed to email payslips.");
    }
  };

  const handleDownloadPayslips = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee.");
      return;
    }
    try {
      const response = await api.post(
        `/payrolls/download-payslips/${companyId}`,
        {
          employeeIds: selectedEmployees,
          payrollId,
        },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/zip" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslips_${companyId}_${payrollId}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      await fetchBatchDetails();
    } catch (error) {
      console.error("Error downloading payslips:", error);
      alert("Failed to download payslips.");
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstRow,
    indexOfLastRow
  );
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-2xl font-bold mb-6">Payroll Management</h1>
      <p className="text-xl font-semibold mb-6">Payslips Data</p>
      <div className="mb-4 flex justify-between w-full items-center gap-4">
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="Search for Employee"
            value={searchEmployee}
            onChange={handleSearch}
            className="p-2 border rounded-md flex-grow"
          />
          <button
            onClick={handleClearSearch}
            className="p-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmailPayslips}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-800"
          >
            Email Payslip
          </button>
          <button
            onClick={handleDownloadPayslips}
            className="p-2 bg-green-500 text-white rounded-md hover:bg-green-800"
          >
            Download Payslip
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto scroll-smooth">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200 sticky top-0">
              <th className="border border-gray-300 p-3">
                <input
                  type="checkbox"
                  checked={
                    selectedEmployees.length === filteredEmployees.length &&
                    filteredEmployees.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th className="border border-gray-300 p-3">Staff No</th>
              <th className="border border-gray-300 p-3">Employee Name</th>
              <th className="border border-gray-300 p-3">Net Pay</th>
              <th className="border border-gray-300 p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((emp) => (
              <tr key={emp.employeeId} className="hover:bg-gray-200">
                <td className="border border-gray-300 p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.employeeId)}
                    onChange={() => handleCheckboxChange(emp.employeeId)}
                  />
                </td>
                <td className="border border-gray-300 p-3">{emp.staffNo}</td>
                <td className="border border-gray-300 p-3">{emp.fullName}</td>
                <td className="border border-gray-300 p-3">
                  {formatNumber(emp.netPay)}
                </td>
                <td className="border border-gray-300 p-3 text-center">
                  <button
                    onClick={() => handleViewClick(emp.employeeId)}
                    className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-100">
              <td className="border border-gray-300 p-3" colSpan={2}>
                TOTAL
              </td>
              <td className="border border-gray-300 p-3">
                {formatNumber(filteredEmployees.length)}
              </td>
              <td className="border border-gray-300 p-3">
                {formatNumber(
                  filteredEmployees.reduce((sum, emp) => sum + emp.netPay, 0)
                )}
              </td>
              <td className="border border-gray-300 p-3"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 w-full">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`p-2 rounded-md ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Next
        </button>
      </div>
      {selectedEmployeeId && (
        <PayslipModal
          companyId={companyId}
          employeeId={selectedEmployeeId}
          payrollId={payrollId}
          onClose={handleCloseModal}
        />
      )}
      {(isLoading || emailSuccess) && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            {isLoading && (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            )}
            {isLoading && <p>Sending...</p>}
            {emailSuccess && (
              <p className="text-green-500 font-bold">
                Payslips emailed successfully!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
