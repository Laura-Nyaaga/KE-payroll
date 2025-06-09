"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePayrollContext } from "../context/PayrollContext";

export default function PayrollStatusBar() {
  const { payrollData, selectedStatus, setSelectedStatus } = usePayrollContext();

  const statuses = [
    { key: "draft", label: "Queued" },
    { key: "pending", label: "Pending" },
    { key: "processed", label: "Processed" },
    { key: "rejected", label: "Rejected" },
    { key: "expired", label: "Expired" },
  ];

  const searchParams = useSearchParams();
  const router = useRouter();


  useEffect(() => {
    const paramStatus = searchParams.get("status");
    if (paramStatus && statuses.find(s => s.key === paramStatus)) {
      setSelectedStatus(paramStatus);
    }
  }, [searchParams]);

  const handleClick = (key) => {
    setSelectedStatus(key);
    const url = new URL(window.location.href);
    url.searchParams.set("status", key);
    router.push(url.toString());
  };

    const statusCounts = payrollData.reduce((acc, employee) => {
    acc[employee.status] = (acc[employee.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex gap-2 overflow-x-auto">
      {statuses.map(({ key, label }) => (
        <button
          key={key}
 onClick={() => handleClick(key)}
           className={`px-4 py-1 rounded-full text-sm border ${
            selectedStatus === key
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {label} [{statusCounts[key] || 0}] 
        </button>
      ))}
    </div>
  );
}



