"use client";

import { usePayrollContext } from "../context/PayrollContext";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useState } from "react";

export default function RefreshPayrollButton() {
  const { payrollId, fetchReadOnlyStatus, selectedEmployees, loading } = usePayrollContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!payrollId) {
      toast.error("Payroll ID is not available.");
      return;
    }
    setIsRefreshing(true);
    await fetchReadOnlyStatus("rejected", payrollId);
        setIsRefreshing(false);
    toast.success("Payroll data refreshed.");
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleRefresh}
        disabled={loading || isRefreshing || selectedEmployees.size === 0}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded text-sm"
      >
        {loading || isRefreshing ? <LoadingSpinner size="small" /> : "Refresh Payroll"}
      </button>
    </div>
  );
}