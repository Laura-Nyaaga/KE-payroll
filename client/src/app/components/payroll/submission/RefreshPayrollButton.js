"use client";

import { usePayrollContext } from "../context/PayrollContext";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useState } from "react";
import toast from "react-hot-toast";
import api, { BASE_URL } from "@/app/config/api";
import { useRoleAccess } from "@/app/utils/roleUtils";
import { useRouter } from "next/navigation";

export default function RefreshPayrollButton() {
  const {
    user,
    loading: permissionLoading,
    hasAccess,
  } = useRoleAccess("PAYROLL");
  const { payrollId, companyId, fetchPayrollData, selectedEmployees, loading, setPayrollData,  setRejectionReason, } = usePayrollContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    if (!payrollId || !companyId) {
      toast.error("Payroll ID or Company ID is not available.");
      return;
    }

    if (!selectedEmployees || selectedEmployees.size === 0) {
      toast.error("No employees selected for refresh.");
      return;
    }

    setIsRefreshing(true);

    try {
      const response = await api.post(`${BASE_URL}/payrolls/${companyId}/refresh`, {
        payrollId,
        employeeIds: [...selectedEmployees], // Convert Set to array
      });

      const result = response.data;

      if (!result.success) {
        if (response.status === 404) {
          toast.error(result.message || "Payroll or employees not found.");
        } else if (response.status === 400) {
          toast.error(result.message || "Some employees are not part of this payroll batch.");
        } else {
          toast.error(result.message || "Failed to refresh payroll.");
        }
        return;
      }

      // Update payroll data in context with the refreshed data
      setPayrollData({
        payrollId: result.payrollId,
        summary: result.summary,
        employees: result.data,
        metadata: result.metadata,
      });

      // Clear rejection reason since backend sets notes to null
     setRejectionReason("");

      // Fetch updated payroll status
      await fetchPayrollData();
      toast.success(result.message || "Payroll data refreshed successfully.");
    } catch (error) {
      console.error("Error refreshing payroll:", error);
      toast.error(error.message || "An unexpected error occurred while refreshing payroll.");
    } finally {
      setIsRefreshing(false);
    }
  };

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




// "use client";

// import { usePayrollContext } from "../context/PayrollContext";
// import LoadingSpinner from "../../common/LoadingSpinner";
// import { useState } from "react";
// import toast from "react-hot-toast";
// import api, { BASE_URL } from "@/app/config/api";
// import { useRoleAccess } from "@/app/utils/roleUtils";
// import { useRouter } from "next/navigation";

// export default function RefreshPayrollButton() {
//   const {
//     user,
//     loading: permissionLoading,
//     hasAccess,
//   } = useRoleAccess("PAYROLL");
//   const { payrollId, companyId, fetchPayrollStatus, selectedEmployees, loading, setPayrollData } = usePayrollContext();
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const router = useRouter();

//   const handleRefresh = async () => {
//     if (!payrollId || !companyId) {
//       toast.error("Payroll ID or Company ID is not available.");
//       return;
//     }

//     if (!selectedEmployees || selectedEmployees.size === 0) {
//       toast.error("No employees selected for refresh.");
//       return;
//     }

//     setIsRefreshing(true);

//     try {
//       const response = await api.post(`${BASE_URL}/payrolls/${companyId}/refresh`, {
//         payrollId,
//         employeeIds: [...selectedEmployees], // Convert Set to array
//       });

//       const result = response.data;

//       if (!result.success) {
//         if (response.status === 404) {
//           toast.error(result.message || "Payroll or employees not found.");
//         } else if (response.status === 400) {
//           toast.error(result.message || "Some employees are not part of this payroll batch.");
//         } else {
//           toast.error(result.message || "Failed to refresh payroll.");
//         }
//         return;
//       }

//       // Update payroll data in context with the refreshed data
//       setPayrollData({
//         payrollId: result.payrollId,
//         summary: result.summary,
//         employees: result.data,
//         metadata: result.metadata,
//       });

//       // Fetch updated read-only status
//       await fetchPayrollStatus("draft", payrollId);
//       toast.success(result.message || "Payroll data refreshed successfully.");
//     } catch (error) {
//       console.error("Error refreshing payroll:", error);
//       toast.error(error.message || "An unexpected error occurred while refreshing payroll.");
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   if (permissionLoading) {
//     return (
//       <div className="flex justify-center items-center h-full min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
//         <p className="ml-4 text-lg text-gray-700">Verifying permissions...</p>
//       </div>
//     );
//   }

//   if (!hasAccess) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gray-100 p-4">
//         <h2 className="text-3xl font-bold text-red-600 mb-4">
//           Unauthorized Access
//         </h2>
//         <p className="text-lg text-gray-700 text-center">
//           You do not have the permission to view this page.
//         </p>
//         <p className="text-md text-gray-500 mt-2 text-center">
//           Please contact your administrator if you believe this is an error or
//           need access.
//         </p>
//         <button
//           onClick={() => router.push("/authenticated/dashboard")}
//           className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
//         >
//           Go to Dashboard
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="mt-4">
//       <button
//         onClick={handleRefresh}
//         disabled={loading || isRefreshing || selectedEmployees.size === 0}
//         className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded text-sm"
//       >
//         {loading || isRefreshing ? <LoadingSpinner size="small" /> : "Refresh Payroll"}
//       </button>
//     </div>
//   );
// }


