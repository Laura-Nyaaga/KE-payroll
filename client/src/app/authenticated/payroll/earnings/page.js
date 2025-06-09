'use client';
import { useState, useEffect } from 'react';
import AddEarningModal from './AddEarningModal';
import EarningsTable from './EarningsTable';
import api, { BASE_URL } from '../../../config/api';

export default function EarningsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [earnings, setEarnings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch earnings from API
  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`${BASE_URL}/earnings/company/${localStorage.getItem('companyId')}`);
        setEarnings(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching earnings:', err);
        setError('Failed to load earnings. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Handle adding a new earning
  const handleAddEarning = async (newEarning) => {
    const companyId = localStorage.getItem('companyId');
    
    try {
      // Prepare request data using proper backend model structure
      const requestData = {
        companyId: companyId,
        earningsType: newEarning.earningsType,
        calculationMethod: newEarning.calculationMethod,
        isTaxable: newEarning.isTaxable,
        mode: newEarning.mode,
        status: 'active',
        startDate: newEarning.startDate
      };
      
      console.log("Sending earning to API:", requestData);
     await api.post(`${BASE_URL}/earnings`, requestData);
      const response = await api.get(`${BASE_URL}/earnings/company/${localStorage.getItem('companyId')}`);

  
      // Add new earning to state
      setEarnings(prevEarnings => [...prevEarnings, response.data]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding earning:', err);
      // Extract error message from response if available
      const errorMessage = err.response?.data?.message || 'Failed to add earning. Please try again.';
      alert(errorMessage);
    }
  };

  // Handle updating an earning
  const handleUpdateEarning = async (updatedEarning) => {
    try {
      // Send update to API
      await api.patch(`${BASE_URL}/earnings/${updatedEarning.id}`, updatedEarning);
      
      // Update local state
      setEarnings(prevEarnings => 
        prevEarnings.map(earning => 
          earning.id === updatedEarning.id ? updatedEarning : earning
        )
      );
    } catch (err) {
      console.error('Error updating earning:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update earning. Please try again.';
      alert(errorMessage);
      
      // Refresh earnings list to ensure UI is in sync with backend
      const fetchEarnings = async () => {
        try {
          const response = await api.get(`${BASE_URL}/earnings/company/${localStorage.getItem('companyId')}`);
          setEarnings(response.data);
        } catch (fetchErr) {
          console.error('Error refreshing earnings data:', fetchErr);
        }
      };
      fetchEarnings();
    }
  };

  // Handle exporting earnings data
  const handleExportData = async () => {
    try {
      const response = await api.get('/payroll/earnings/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'earnings_export.csv');
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting earnings:', err);
      alert('Failed to export earnings. Please try again.');
    }
  };

  // Handle earning changes
  const handleEarningChange = (updatedEarnings) => {
    // Find which earning was updated
    const changedEarning = updatedEarnings.find((earning, index) => {
      return JSON.stringify(earning) !== JSON.stringify(earnings[index]);
    });
    
    if (changedEarning) {
      handleUpdateEarning(changedEarning);
    } else {
      setEarnings(updatedEarnings);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Payroll Settings</h1>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Earnings</h2>
        <div className="flex items-center gap-4">
          <button 
            className="flex items-center text-pink-500 hover:text-pink-600 transition-colors"
            onClick={handleExportData}
            disabled={isLoading || earnings.length === 0}
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
            Add Earning
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
          onEarningsChange={handleEarningChange} 
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