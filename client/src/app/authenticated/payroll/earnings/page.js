"use client";
import { useState, useEffect, useCallback } from "react"; // Added useCallback
import AddEarningModal from "./AddEarningModal";
import EarningsTable from "./EarningsTable";
import api, { BASE_URL } from "../../../config/api";

export default function EarningsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [earnings, setEarnings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch earnings from API - wrapped in useCallback
  const fetchEarnings = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const companyId = localStorage.getItem("companyId");
      if (!companyId) {
        throw new Error("Company ID not found. Please log in again.");
      }
      const response = await api.get(
        `${BASE_URL}/earnings/company/${companyId}`
      );
      setEarnings(response.data);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      setError("Failed to load earnings. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // Fetch earnings on component mount
  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]); // Dependency array includes fetchEarnings

  // Handle adding a new earning
  const handleAddEarning = async (newEarning) => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      alert("Company ID not found. Cannot add earning.");
      return;
    }

    try {
      setIsLoading(true); // Indicate loading for the add operation

      // Prepare request data using proper backend model structure
      const requestData = {
        companyId: companyId,
        earningsType: newEarning.earningsType,
        calculationMethod: newEarning.calculationMethod,
        isTaxable: newEarning.isTaxable,
        mode: newEarning.mode,
        status: "active", // Default to active for new earnings
        startDate: newEarning.startDate,
        fixedAmount: newEarning.fixedAmount || null, // Include fixedAmount if present
      };

      console.log("Sending earning to API:", requestData);
      await api.post(`${BASE_URL}/earnings`, requestData);

      // After successful addition, re-fetch the entire list to ensure consistency
      await fetchEarnings();
      setShowAddModal(false);
      alert("Earning added successfully!");
    } catch (err) {
      console.error("Error adding earning:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to add earning. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false); // End loading, whether successful or not
    }
  };

  // Handle updating an earning
  const handleUpdateEarning = async (updatedEarningData) => {
    try {
      setIsLoading(true); // Indicate loading for the update operation
      console.log("Updating earning:", updatedEarningData);
      await api.patch(
        `${BASE_URL}/earnings/${updatedEarningData.id}`,
        updatedEarningData
      );

      // After successful update, re-fetch the entire list to ensure consistency
      await fetchEarnings();
      alert("Earning updated successfully!");
    } catch (err) {
      console.error("Error updating earning:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update earning. Please try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Payroll Settings</h1>

      <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-2 ">
        <p className="text-sm">
          <span className="font-bold">NOTE: </span>Define any company allowances e.g
          Transport Allowance other than Basic salary
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Allowances</h2>
        <div className="flex items-center gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors"
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
          >
            Add Allowance
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
          {error}
        </div>
      ) : (
        <EarningsTable
          earnings={earnings}
          onEarningsChange={handleUpdateEarning} // Pass the update handler directly
        />
      )}

      {showAddModal && (
        <AddEarningModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddEarning}
        />
      )}
    </div>
  );
}
