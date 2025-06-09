'use client';
import { useState, useEffect } from 'react';
import AddDeductionModal from './AddDeductionModal';
import DeductionsTable from './DeductionsTable';
import { BASE_URL } from '@/app/config/api';

export default function DeductionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deductions, setDeductions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch deductions from API
  useEffect(() => {
    const fetchDeductions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/deductions/company/${localStorage.getItem('companyId')}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure consistent data format
        const normalizedDeductions = data.map(deduction => ({
          ...deduction,
          // Ensure status is lowercase to match backend expectations
          status: deduction.status?.toLowerCase() || 'active' 
        }));
        
        setDeductions(normalizedDeductions);
        setError(null);
      } catch (err) {
        console.error('Error fetching deductions:', err);
        setError('Failed to load deductions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeductions();
  }, []);

  // Handle adding a new deduction
          const handleAddDeduction = async (newDeduction) => {
            const companyId = localStorage.getItem('companyId');
            
            try {
              setIsLoading(true);
              
              const requestData = {
                deductionType: newDeduction.deductionType,
                calculationMethod: newDeduction.calculationMethod,
                mode: newDeduction.mode,
                isTaxable: newDeduction.isTaxable,
                status: 'active',
                startDate: newDeduction.startDate,
                companyId: companyId,
              };
              
              const response = await fetch(`${BASE_URL}/deductions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add deduction');
              }

              const addedDeduction = await response.json();
              setDeductions(prev => [...prev, addedDeduction]);
              setShowAddModal(false);
              setError(null);
            } catch (err) {
              setError(err.message);
            } finally {
              setIsLoading(false);
            }
          };

// Handle updating deductions
const handleUpdateDeductions = async (updatedDeductions) => {
  try {
    setIsLoading(true);
    setError(null);
    
    // Validate input
    if (!Array.isArray(updatedDeductions)) {
      throw new Error('Deductions data must be an array');
    }

    // Update state
    setDeductions(updatedDeductions);
    
    // Update each modified deduction in the backend
    const updatePromises = updatedDeductions.map(async (deduction) => {
      // Remove fields that cannot be updated
      const { deductionType, calculationMethod, mode, ...updatableFields } = deduction;
      
      // Ensure we're sending all required fields
      const deductionToUpdate = {
        ...updatableFields,
        // Make sure these fields are properly formatted
        companyId: localStorage.getItem('companyId'),
        // amount: deduction.calculationMethod === 'fixed_amount' ? parseFloat(deduction.amount) || 0 : null,
        percentage: deduction.calculationMethod === 'percentage' ? parseFloat(deduction.percentage) || 0 : null,
        // Ensure status is lowercase for backend
        status: deduction.status?.toLowerCase()
      };
      
      const response = await fetch(`${BASE_URL}/deductions/${deduction.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deductionToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error details:', errorData);
        throw new Error(`Failed to update deduction (ID: ${deduction.id}). Status: ${response.status}`);
      }

      return response.json();
    });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Update failed:', error);
      setError(error.message);
      // Fetch fresh data from server to recover
      fetchDeductions();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refetches deductions from the API
  const fetchDeductions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/deductions/company/${localStorage.getItem('companyId')}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      const normalizedDeductions = data.map(deduction => ({
        ...deduction,
        status: deduction.status?.toLowerCase() || 'active'
      }));
      
      setDeductions(normalizedDeductions);
      setError(null);
    } catch (err) {
      console.error('Error fetching deductions:', err);
      setError('Failed to load deductions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle exporting deductions data
  const handleExportData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/deductions/company/${localStorage.getItem('companyId')}/export`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'deductions_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting deductions:', err);
      setError('Failed to export deductions. Please try again.');
    }
  };

  // Handle deduction changes
  const handleDeductionChange = (updatedDeductions) => {
    handleUpdateDeductions(updatedDeductions);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payroll Settings</h1>
      
      {/* Error display */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 border border-red-200 rounded-md">
          <p>{error}</p>
          <button 
            onClick={() => fetchDeductions()}
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
            className="flex items-center text-red-500"
            onClick={handleExportData}
            disabled={isLoading || (deductions && deductions.length === 0)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button 
            className="bg-cyan-400 hover:bg-cyan-500 text-white px-4 py-2 rounded"
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
          onDeductionsChange={handleDeductionChange} 
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