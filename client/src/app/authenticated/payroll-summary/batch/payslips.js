"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import api from "@/app/config/api"

export default function PayslipModal({
  companyId,
  employeeId,
  payrollId,
  onClose,
}) {
  const [payslip, setPayslip] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  // cont [ ]

  useEffect(() => {
    fetchPayslip();
  }, []);

  const fetchPayslip = async () => {
    try {
      const response = await api.get(
        `/payrolls/payslip/${companyId}/${employeeId}/${payrollId}`
      );
      setPayslip(response.data.data);
    } catch (error) {
      console.error("Error fetching payslip:", error);
    }
  };

  const handleEmailPayslip = async () => {
    if (!payslip) return;
    setIsLoading(true);
    try {
      await api.post(`/payrolls/email-payslips/${companyId}`, {
        employeeIds: [employeeId],
        payrollId,
      });
      setEmailSuccess(true);
      setTimeout(() => {
        setEmailSuccess(false);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Error emailing payslip:", error);
      setIsLoading(false);
    }
  };

  const handleDownloadPayslip = async () => {
    try {
      const response = await api.post(
        `/payrolls/download-payslips/${companyId}`,
        {
          employeeIds: [employeeId],
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
    } catch (error) {
      console.error("Error downloading payslip:", error);
    }
  };

  if (!payslip) return null;

  const renderTableRow = (label, value) => (
    <div className="flex justify-between border-b border-gray-300 py-1">
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </div>
  );

  const renderSectionTitle = (title) => (
    <div className="bg-gray-200 p-2 font-bold text-lg my-2">{title}</div>
  );

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-md flex items-center justify-center overflow-y-auto z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full h-full max-w-4xl overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-red-700 hover:text-gray-700 text-2xl font-bold"
        >
          X
        </button>

        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center border border-gray-400 p-4 w-1/2">
            {payslip.companyLogo ? (
              <Image
                src={payslip.companyLogo}
                alt={`logo`}
                width={48}
                height={48}
                className="rounded-lg object-cover"
                priority
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mr-4 text-xl font-bold text-white">
                {payslip.company
                  ? payslip.company.substring(0, 2).toUpperCase()
                  : "AB"}
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-gray-800">
                {payslip.company}
              </p>
              <h3 className="text-md font-semibold text-gray-700">
                Pay Slip for the Month of {payslip.month}, {payslip.year}
              </h3>
            </div>
          </div>

          <div className="p-4 bg-gray-100 border border-gray-300 ml-4 flex flex-col justify-center items-center h-40 w-1/2">
            <button
              onClick={handleEmailPayslip}
              className="w-3/4 p-3 mb-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition duration-200"
              disabled={isLoading}
            >
              Email Payslip
            </button>
            <button
              onClick={handleDownloadPayslip}
              className="w-3/4 p-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition duration-200"
            >
              Download Payslip
            </button>
          </div>
        </div>

        {/* Employee Details Section */}
        <div className="border border-gray-300 p-4 mb-6">
          {renderTableRow("Pay Date", payslip.payDate)}
          {renderTableRow("Staff No", payslip.staffNo)}
          {renderTableRow("Full Name", payslip.fullName)}
          {renderTableRow("Job Title", payslip.jobTitle)}
          {renderTableRow("Department", payslip.department)}
          {renderTableRow("Currency", payslip.currency)}
          {renderTableRow("KRA Pin", payslip.kraPin)}
        </div>

        {/* Earnings Section */}
        <div className="border border-gray-300 p-4 mb-6">
          {renderSectionTitle("Earnings")}
          {Object.entries(payslip.earnings || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1 px-4">
              <span>{key}</span>
              <span>{value}</span>
            </div>
          ))}
          {payslip.otherEarnings &&
            Object.keys(payslip.otherEarnings).length > 0 && (
              <>
                <div className="text-sm font-semibold mt-2 px-4">
                  Other Earnings:
                </div>
                {Object.entries(payslip.otherEarnings).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-1 pl-8 pr-4 text-sm"
                  >
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </>
            )}
          <div className="flex justify-between border-t border-gray-400 font-bold mt-2 pt-2 px-4">
            <span>Gross Pay</span>
            <span>{payslip.grossPay}</span>
          </div>
        </div>

        {/* Deductions Section */}
        <div className="border border-gray-300 p-4 mb-6">
          {renderSectionTitle("Deductions")}
          {Object.entries(payslip.statutoryDeductions || {}).map(
            ([key, value]) => (
              <div key={key} className="flex justify-between py-1 px-4">
                <span>{key}</span>
                <span>{value}</span>
              </div>
            )
          )}
          {payslip.otherDeductions &&
            Object.keys(payslip.otherDeductions).length > 0 && (
              <>
                <div className="text-sm font-semibold mt-2 px-4">
                  Other Deductions:
                </div>
                {Object.entries(payslip.otherDeductions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between py-1 pl-8 pr-4 text-sm"
                  >
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </>
            )}
          <div className="flex justify-between border-t border-gray-400 font-bold mt-2 pt-2 px-4">
            <span>Total Deductions</span>
            <span>{payslip.allDeductions}</span>
          </div>
        </div>

        {/* Net Pay Section */}
        <div className="border border-gray-300 p-4 mb-6">
          {renderSectionTitle("Net Pay")}
          <div className="flex justify-between font-bold text-lg px-4">
            <span>Net Pay</span>
            <span>
              {payslip.netPay} {payslip.currency}
            </span>
          </div>
        </div>

        {/* PAYE Information Section */}
        <div className="border border-gray-300 p-4 mb-6">
          {renderSectionTitle("P.A.Y.E Information")}
          <div className="flex justify-between py-1 px-4">
            <span>Gross Pay</span>{" "}
            {/* Mapping 'Total Earnings' from your data to 'Gross Pay' as per image */}
            <span>{payslip.payeInfo.totalEarnings}</span>
          </div>
          {payslip.payeInfo.lessPreTaxDeductions &&
            payslip.payeInfo.lessPreTaxDeductions.length > 0 &&
            payslip.payeInfo.lessPreTaxDeductions.map((item, index) => (
              <div key={index} className="flex justify-between py-1 pl-8 pr-4">
                <span>{item.label}</span>
                <span>{item.amount}</span>
              </div>
            ))}
          <div className="flex justify-between py-1 px-4">
            <span>Taxable Pay</span>
            <span>{payslip.payeInfo.taxablePay}</span>
          </div>
          <div className="flex justify-between py-1 px-4">
            <span>Gross P.A.Y.E</span>
            <span>{payslip.payeInfo.grossTax}</span>
          </div>
          <div className="flex justify-between py-1 px-4">
            <span>Personal Relief</span>
            <span>{payslip.payeInfo.personalRelief}</span>
          </div>
          {payslip.payeInfo.insuranceRelief && (
            <div className="flex justify-between py-1 px-4">
              <span>Insurance Relief</span>
              <span>{payslip.payeInfo.insuranceRelief}</span>
            </div>
          )}
          {payslip.payeInfo.housingLevyRelief && (
            <div className="flex justify-between py-1 px-4">
              <span>Housing Levy Relief</span>
              <span>{payslip.payeInfo.housingLevyRelief}</span>
            </div>
          )}
          <div className="flex justify-between py-1 px-4">
            <span>P.A.Y.E</span>
            <span>{payslip.payeInfo.paye}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-gray-600 mt-4">
          <p>Created On: {payslip.createdOn}</p>
          <p>Created By: {payslip.createdBy}</p>
        </div>
      </div>

      {/* Loading/Success Modal */}
      {(isLoading || emailSuccess) && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            {isLoading && (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            )}
            {isLoading && <p>Sending...</p>}
            {emailSuccess && (
              <p className="text-green-500 font-bold">
                Payslip emailed successfully!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}