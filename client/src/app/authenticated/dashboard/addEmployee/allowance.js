import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '../../../config/api';

const AllowanceComponent = ({
  allowances,
  handleAllowanceChange,
  handleRemoveAllowance,
  handleAddAllowance
}) => {
  const [allowanceTypes, setAllowanceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllowanceTypes = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          setError('Company ID not found in local storage. Cannot fetch allowance types.');
          setLoading(false);
          // Fallback to default options if no companyId
          setAllowanceTypes([
            { id: 'housing', name: 'Housing Allowance' },
            { id: 'transport', name: 'Transport Allowance' },
            { id: 'medical', name: 'Medical Allowance' },
            { id: 'meal', name: 'Meal Allowance' },
            { id: 'education', name: 'Education Allowance' }
          ]);
          return;
        }

        const response = await api.get(`${BASE_URL}/allowances/company/${companyId}`); // This already uses 'api'
        setAllowanceTypes(response.data); // Axios wraps response in .data
        setError(null); // Clear error on successful fetch
      } catch (err) {
        console.error('Error fetching allowance types:', err);
        // More robust error message extraction from Axios error
        setError(err.response?.data?.message || 'Failed to load allowance types. Using default options instead.');
        // Fallback to default options if API fails
        setAllowanceTypes([
          { id: 'housing', name: 'Housing Allowance' },
          { id: 'transport', name: 'Transport Allowance' },
          { id: 'medical', name: 'Medical Allowance' },
          { id: 'meal', name: 'Meal Allowance' },
          { id: 'education', name: 'Education Allowance' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllowanceTypes();
  }, []);

  return (
    <div className="md:col-span-2 mb-4">
      <h4 className="font-medium mb-2">Added Allowances</h4>
      
      {error && (
        <div className="text-amber-600 bg-amber-50 p-2 mb-3 rounded-md border border-amber-200 text-sm">
          {error}
        </div>
      )}
      
      {allowances.map((allowance, index) => (
        <div key={index} className="flex flex-col md:flex-row gap-2 mb-3 p-3 border border-gray-200 rounded-md bg-white">
          <div className="flex-1">
            <select
              value={allowance.name}
              onChange={(e) => handleAllowanceChange(index, 'name', e.target.value)}
              className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
              disabled={loading}
            >
              <option value="" disabled>Select Allowance Type</option>
              {allowanceTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <input
              type="number"
              value={allowance.amount}
              onChange={(e) => handleAllowanceChange(index, 'amount', e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button
            type="button"
            onClick={() => handleRemoveAllowance(index)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition duration-200"
            aria-label="Delete allowance"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
      
      <button 
        type="button" 
        onClick={handleAddAllowance} 
        className="mt-2 bg-teal-100 hover:bg-teal-200 text-teal-700 py-2 px-4 rounded flex items-center justify-center transition duration-200"
        disabled={loading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Another Allowance
      </button>
    </div>
  );
};

export default AllowanceComponent;