'use client';
import { useState, useEffect } from 'react';
import AddAllowanceModal from './AddAllowanceModal';
import AllowancesTable from './AllowanceTable';

import api, { BASE_URL } from '../../../config/api';

export default function AllowancesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [allowances, setAllowances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch allowances from API
  useEffect(() => {
    const fetchAllowances = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`${BASE_URL}/allowances/company/${localStorage.getItem('companyId')}`);
        setAllowances(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching allowances:', err);
        setError('Failed to load allowances. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllowances();
  }, []);

  // Handle adding a new allowance
  // const handleAddAllowance = async (newAllowance) => {
  //   try {
  //     const response = await api.post(`${BASE_URL}/allowances`, newAllowance);
  //     setAllowances(prevAllowances => [...prevAllowances, response.data]);
  //     setShowAddModal(false);
  //   } catch (err) {
  //     console.error('Error adding allowance:', err);
  //     alert('Failed to add allowance. Please try again.');
  //   }
  // };


  const handleAddAllowance = async (newAllowance) => {
    const companyId = localStorage.getItem('companyId');
    const requestData = {
        ...newAllowance,
        companyId: companyId,
        calculationMethod: newAllowance.calculationMethod === 'Fixed' ? 'fixed_amount' : 'percentage',
        status: 'active', // Match backend expectation
        customAmount: null // Include all model fields
    };
    
    try {
        console.log("Sending allowance to API:", requestData);
        const response = await fetch(`${BASE_URL}/allowances`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json(); // Get more error details
            console.error('Server error details:', errorData);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const addedAllowance = await response.json();
        setAllowances(prevAllowances => [...prevAllowances, addedAllowance]);
        setShowAddModal(false);
    } catch (err) {
        console.error('Error adding allowance:', err);
        alert('Failed to add allowance. Please try again.');
    }
};

  const handleUpdateAllowances = async (updatedAllowances) => {
    try {
      setIsLoading(true);
      setError(null);
  
      if (!Array.isArray(updatedAllowances)) {
        throw new Error('Allowances data must be an array');
      }
  
      // Update state immediately for optimistic UI
      setAllowances(updatedAllowances);
  
      const updatePromises = updatedAllowances.map(async (allowance) => {
        // Create a clean payload with only the fields the API expects
        const payload = {
          allowanceType: allowance.allowanceType,
          calculationMethod: allowance.calculationMethod,
          amount: allowance.amount,
          percentage: allowance.percentage,
          startDate: allowance.startDate,
          endDate: allowance.endDate,
          isTaxable: allowance.isTaxable,
          companyId: localStorage.getItem('companyId')
        };
        console.log('Payload being sent:', payload);

  
        const response = await api.patch(
          `${BASE_URL}/allowances/${allowance.id}`,
          payload
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update allowance ID ${allowance.id}. Status: ${response.status}. Message: ${errorData.message || 'Unknown error'}`
          );
        }
  
        return response.data;
      });
  
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Update failed:', error.response?.data || error.message);
      setError(error.message);
      
      // Re-fetch the original data to revert the optimistic update
      try {
        const response = await api.get(
          `${BASE_URL}/allowances/company/${localStorage.getItem('companyId')}`
        );
        setAllowances(response.data);
      } catch (fetchError) {
        console.error('Failed to revert allowances:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  // Handle exporting allowances data
  const handleExportData = async () => {
    try {
      const response = await api.get('/payroll/allowances/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'allowances_export.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting allowances:', err);
      alert('Failed to export allowances. Please try again.');
    }
  };

  // Handle allowance changes
  const handleAllowanceChange = (updatedAllowances) => {
    setAllowances(updatedAllowances);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Payroll Settings</h1>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Allowances</h2>
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center text-pink-500 hover:text-pink-600 transition-colors"
            onClick={handleExportData}
            disabled={isLoading || allowances.length === 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button 
            className="bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors"
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
        <AllowancesTable 
          allowances={allowances} 
          onAllowancesChange={handleAllowanceChange} 
          handleUpdateAllowances={handleUpdateAllowances}  

        />
      )}

      {showAddModal && (
        <AddAllowanceModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAllowance}
        />
      )}
    </div>
  );
}