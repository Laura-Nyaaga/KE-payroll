'use client';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback for fetchDeductions
import AddDeductionModal from './AddDeductionModal';
import DeductionsTable from './DeductionsTable';
import api, { BASE_URL } from '@/app/config/api';

export default function DeductionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deductions, setDeductions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refetches deductions from the API - Wrapped in useCallback for optimization
  const fetchDeductions = useCallback(async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        throw new Error('Company ID not found. Please log in again.');
      }
      const response = await api.get(`${BASE_URL}/deductions/company/${companyId}`);
      setDeductions(response.data);
    } catch (err) {
      console.error('Error fetching deductions:', err);
      setError('Failed to load deductions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  // Fetch deductions from API on component mount
  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]); // Dependency array includes fetchDeductions

  // Handle adding a new deduction
  const handleAddDeduction = async (newDeduction) => {
    const companyId = localStorage.getItem('companyId');
    if (!companyId) {
      alert('Company ID not found. Cannot add deduction.');
      return;
    }

    try {
      setIsLoading(true); // Indicate loading for the add operation

      const requestData = {
        deductionType: newDeduction.deductionType,
        calculationMethod: newDeduction.calculationMethod,
        mode: newDeduction.mode,
        isTaxable: newDeduction.isTaxable,
        status: 'active', // Default to active for new deductions
        startDate: newDeduction.startDate,
        companyId: companyId,
        // If fixedAmount is part of the new deduction type, ensure it's sent
        fixedAmount: newDeduction.fixedAmount || null,
      };

      console.log('Sending deduction to API:', requestData);
      await api.post(`${BASE_URL}/deductions`, requestData);

      // After successful addition, re-fetch the entire list to ensure consistency
      await fetchDeductions();
      setShowAddModal(false);
      alert('Deduction added successfully!');
    } catch (err) {
      console.error('Error adding deduction:', err);
      const errorMessage = err.response?.data?.message || 'Failed to add deduction. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false); // End loading, whether successful or not
    }
  };

  // Handle updating an existing deduction
  const handleUpdateDeductions = async (updatedDeductionData) => {
    try {
      setIsLoading(true); // Indicate loading for the update operation
      console.log('Updating deduction:', updatedDeductionData);
      await api.patch(`${BASE_URL}/deductions/${updatedDeductionData.id}`, updatedDeductionData);

      // After successful update, re-fetch the entire list to ensure consistency
      await fetchDeductions();
      alert('Deduction updated successfully!');
    } catch (err) {
      console.error('Error updating deduction:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update deduction. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payroll Settings</h1>

     <div className="bg-blue-100 text-blue-800 p-3 rounded-md mb-2">
        <p className="text-sm"><span className="font-bold">NOTE: </span>Define any company deductions e.g 
        Staff Loans other than Statutory Deductions (PAYE, NSSF, SHIF, AHL)</p>
    </div>

      {/* Error display */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-md">
          <p>{error}</p>
          <button
            onClick={fetchDeductions} // Use the useCallback version
            className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Deductions</h2>
        <div className="flex items-center gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => setShowAddModal(true)}
          >
            Add Deduction
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
        </div>
      ) : (
        <DeductionsTable
          deductions={deductions}
          onDeductionsChange={handleUpdateDeductions} // Pass the update handler
        />
      )}

      {showAddModal && (
        <AddDeductionModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDeduction}
        />
      )}
    </div>
  );
}
