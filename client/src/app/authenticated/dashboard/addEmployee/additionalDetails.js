'use client';
import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import api, { BASE_URL } from '../../../config/api';


const AdditionalDetailsForm = ({ onFormSubmit, handleBack }) => {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue, getValues } = useFormContext();

  // State for storing earnings and deductions
  const [earnings, setEarnings] = useState([]);
  const [deductions, setDeductions] = useState([]);

  // State for toggle sections
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [deductionsOpen, setDeductionsOpen] = useState(false);

  // State for API data
  const [earningTypes, setEarningTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');  // 'earnings' or 'deductions'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemDetails, setSelectedItemDetails] = useState({
    id: null,
    name: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    endDate: '',
    calculationMethod: '',
    mode: '',
    customPercentage: '',
    customMonthlyAmount: '',
    customNumberOfHours: '',
    customHourlyRate: '',
    customNumberOfDays: '',
    customDailyRate: '',
    customNumberOfWeeks: '',
    customWeeklyRate: '',
    calculatedAmount: '',
    fixedAmount: ''
  });

  // Fetch earnings and deduction types from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          setError('Company ID not found in local storage.');
          setLoading(false);
          return;
        }

        // Fetch earnings types using the 'api' instance
        const earningsResponse = await api.get(`${BASE_URL}/earnings/company/${companyId}`);
        setEarningTypes(earningsResponse.data); // Axios wraps response in .data

        // Fetch deduction types using the 'api' instance
        const deductionResponse = await api.get(`${BASE_URL}/deductions/company/${companyId}`);
        setDeductionTypes(deductionResponse.data); // Axios wraps response in .data

      } catch (err) {
        // Axios errors provide useful response objects
        setError(err.response?.data?.message || err.message || 'Error fetching data.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open modal to add new item
  const handleOpenAddModal = (type, itemId) => {
    let selectedTypeItem = null;
    
    if (type === 'earnings') {
      selectedTypeItem = earningTypes.find(item => item.id === itemId);
    } else {
      selectedTypeItem = deductionTypes.find(item => item.id === itemId);
    }
    
    if (!selectedTypeItem) return;
    
    setSelectedItem(selectedTypeItem);
    setModalType(type);
    
    setSelectedItemDetails({
      id: selectedTypeItem.id,
      name: type === 'earnings' ? selectedTypeItem.earningsType : selectedTypeItem.deductionType,
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      calculationMethod: selectedTypeItem.calculationMethod,
      mode: selectedTypeItem.mode,
      customPercentage: '',
      customMonthlyAmount: selectedTypeItem.calculationMethod === 'fixed_amount' && selectedTypeItem.mode === 'monthly' ? 
        selectedTypeItem.fixedAmount || '' : '',
      customNumberOfHours: '',
      customHourlyRate: selectedTypeItem.calculationMethod === 'fixed_amount' && selectedTypeItem.mode === 'hourly' ? 
        selectedTypeItem.fixedAmount || '' : '',
      customNumberOfDays: '',
      customDailyRate: selectedTypeItem.calculationMethod === 'fixed_amount' && selectedTypeItem.mode === 'daily' ? 
        selectedTypeItem.fixedAmount || '' : '',
      customNumberOfWeeks: '',
      customWeeklyRate: selectedTypeItem.calculationMethod === 'fixed_amount' && selectedTypeItem.mode === 'weekly' ? 
        selectedTypeItem.fixedAmount || '' : '',
      calculatedAmount: '',
      fixedAmount: selectedTypeItem.fixedAmount || ''
    });
    
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setSelectedItemDetails({
      id: null,
      name: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      calculationMethod: '',
      mode: '',
      customPercentage: '',
      customMonthlyAmount: '',
      customNumberOfHours: '',
      customHourlyRate: '',
      customNumberOfDays: '',
      customDailyRate: '',
      customNumberOfWeeks: '',
      customWeeklyRate: '',
      calculatedAmount: '',
      fixedAmount: ''
    });
  };



  const handleSaveModal = () => {
    if (!selectedItem) return;
  
    // Create the complete item object with all necessary details
    const newItem = {
      type: modalType, // 'earnings' or 'deductions'
      id: selectedItem.id,
      name: selectedItemDetails.name,
      effectiveDate: selectedItemDetails.effectiveDate,
      endDate: selectedItemDetails.endDate || null,
      calculationMethod: selectedItem.calculationMethod,
      mode: selectedItem.mode,
      fixedAmount: selectedItem.fixedAmount || null,
      details: {
        // Common fields
        customPercentage: selectedItemDetails.customPercentage || null,
        calculatedAmount: null, // Will be calculated below
        
        // Mode-specific fields
        ...(selectedItem.mode === 'monthly' && {
          customMonthlyAmount: selectedItemDetails.customMonthlyAmount || null
        }),
        ...(selectedItem.mode === 'hourly' && {
          customNumberOfHours: selectedItemDetails.customNumberOfHours || null,
          customHourlyRate: selectedItemDetails.customHourlyRate || null
        }),
        ...(selectedItem.mode === 'daily' && {
          customNumberOfDays: selectedItemDetails.customNumberOfDays || null,
          customDailyRate: selectedItemDetails.customDailyRate || null
        }),
        ...(selectedItem.mode === 'weekly' && {
          customNumberOfWeeks: selectedItemDetails.customNumberOfWeeks || null,
          customWeeklyRate: selectedItemDetails.customWeeklyRate || null
        })
      }
    };
  
    // Calculate the amount based on calculation method and mode
    if (selectedItem.calculationMethod === 'percentage') {
      newItem.details.calculatedAmount = `${selectedItemDetails.customPercentage || 0}%`;
    } else {
      switch (selectedItem.mode) {
        case 'monthly':
          newItem.details.calculatedAmount = selectedItemDetails.customMonthlyAmount || selectedItem.fixedAmount || '0';
          break;
        case 'hourly':
          newItem.details.calculatedAmount = (
            parseFloat(selectedItemDetails.customNumberOfHours || 0) * 
            parseFloat(selectedItemDetails.customHourlyRate || selectedItem.fixedAmount || 0)
          ).toString();
          break;
        case 'daily':
          newItem.details.calculatedAmount = (
            parseFloat(selectedItemDetails.customNumberOfDays || 0) * 
            parseFloat(selectedItemDetails.customDailyRate || selectedItem.fixedAmount || 0)
          ).toString();
          break;
        case 'weekly':
          newItem.details.calculatedAmount = (
            parseFloat(selectedItemDetails.customNumberOfWeeks || 0) * 
            parseFloat(selectedItemDetails.customWeeklyRate || selectedItem.fixedAmount || 0)
          ).toString();
          break;
        default:
          newItem.details.calculatedAmount = selectedItem.fixedAmount || '0';
      }
    }
  
    // Update the appropriate state based on modal type
    if (modalType === 'earnings') {
      const updatedEarnings = [...earnings, newItem];
      setEarnings(updatedEarnings);
      setValue('earnings', updatedEarnings);
    } else {
      const updatedDeductions = [...deductions, newItem];
      setDeductions(updatedDeductions);
      setValue('deductions', updatedDeductions);
    }
  
    // Close the modal
    handleCloseModal();
  };
  
  // This would be your form submission handler
  const handleFormSubmit = async (formData) => {
    try {
      // 1. First create the employee (without earnings/deductions)
      const employeeData = {
        ...formData,
        earnings: undefined,
        deductions: undefined
      };
      
      const employeeResponse = await api.post('/employees', employeeData);
      const employeeId = employeeResponse.data.id;
  
      // 2. Process all earnings assignments
      const earningsAssignments = (formData.earnings || []).map(item => ({
        employeeId,
        earningId: item.id,
        effectiveDate: item.effectiveDate,
        endDate: item.endDate,
        calculationValue: item.calculationMethod === 'percentage' 
          ? parseFloat(item.details.customPercentage) 
          : parseFloat(item.details.calculatedAmount)
      }));
  
      await Promise.all(
        earningsAssignments.map(assignment => 
          api.post('/earnings/assign', assignment)
        )
      );
  
      // 3. Process all deductions assignments
      const deductionsAssignments = (formData.deductions || []).map(item => ({
        employeeId,
        deductionId: item.id,
        effectiveDate: item.effectiveDate,
        endDate: item.endDate,
        calculationValue: item.calculationMethod === 'percentage' 
          ? parseFloat(item.details.customPercentage) 
          : parseFloat(item.details.calculatedAmount)
      }));
  
      await Promise.all(
        deductionsAssignments.map(assignment => 
          api.post('/deductions/assign', assignment)
        )
      );
  
      // 4. Show success and redirect
      alert('Employee created successfully with all assignments!');
      router.push('/employees');
    } catch (error) {
      console.error('Error in form submission:', error);
      setError(`Failed to complete employee creation: ${error.message}`);
    }
  };
  
  // Usage in your form component
  const onSubmit = handleSubmit(async (formData) => {
    await handleFormSubmit(formData);
  });







// Helper function to calculate amount
const calculateAmount = (item, details) => {
  if (item.calculationMethod === 'percentage') {
    return `${details.customPercentage}% of basic salary`;
  }
  
  switch (item.mode) {
    case 'monthly':
      return details.customMonthlyAmount;
    case 'hourly':
      return parseFloat(details.customNumberOfHours || 0) * 
             parseFloat(details.customHourlyRate || 0);
    // other cases...
    default:
      return 0;
  }
};

  // Handle removing an item
  const handleRemoveItem = (type, index) => {
    if (type === 'earnings') {
      const updatedEarnings = earnings.filter((_, i) => i !== index);
      setEarnings(updatedEarnings);
      setValue('earnings', updatedEarnings);
    } else {
      const updatedDeductions = deductions.filter((_, i) => i !== index);
      setDeductions(updatedDeductions);
      setValue('deductions', updatedDeductions);
    }
  };

  // Handle input change in modal
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedItemDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading data: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render the appropriate input fields based on calculation method and mode
  const renderAmountFields = () => {
    if (!selectedItem) return null;
    
    if (selectedItem.calculationMethod === 'percentage') {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Custom Percentage
          </label>
          <input
            type="number"
            name="customPercentage"
            value={selectedItemDetails.customPercentage}
            onChange={handleModalInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            step="0.01"
            min="0"
            max="100"
          />
        </div>
      );
    } else if (selectedItem.calculationMethod === 'fixed_amount') {
      switch (selectedItem.mode) {
        case 'monthly':
          return (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Monthly Amount
              </label>
              <input
                type="number"
                name="customMonthlyAmount"
                value={selectedItemDetails.customMonthlyAmount}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                step="0.01"
                min="0"
                placeholder={selectedItem.fixedAmount || "Enter amount"}
              />
              {selectedItem.fixedAmount && (
                <p className="text-sm text-gray-500 mt-1">Default amount: {selectedItem.fixedAmount}</p>
              )}
            </div>
          );
        case 'hourly':
          return (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Number of Hours
                </label>
                <input
                  type="number"
                  name="customNumberOfHours"
                  value={selectedItemDetails.customNumberOfHours}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  name="customHourlyRate"
                  value={selectedItemDetails.customHourlyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={selectedItem.fixedAmount || "Enter rate"}
                />
                {selectedItem.fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate: {selectedItem.fixedAmount}</p>
                )}
              </div>
            </>
          );
        case 'daily':
          return (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  name="customNumberOfDays"
                  value={selectedItemDetails.customNumberOfDays}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Daily Rate
                </label>
                <input
                  type="number"
                  name="customDailyRate"
                  value={selectedItemDetails.customDailyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={selectedItem.fixedAmount || "Enter rate"}
                />
                {selectedItem.fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate: {selectedItem.fixedAmount}</p>
                )}
              </div>
            </>
          );
        case 'weekly':
          return (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Number of Weeks
                </label>
                <input
                  type="number"
                  name="customNumberOfWeeks"
                  value={selectedItemDetails.customNumberOfWeeks}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Weekly Rate
                </label>
                <input
                  type="number"
                  name="customWeeklyRate"
                  value={selectedItemDetails.customWeeklyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={selectedItem.fixedAmount || "Enter rate"}
                />
                {selectedItem.fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate: {selectedItem.fixedAmount}</p>
                )}
              </div>
            </>
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="space-y-6 text-black">
      
      {/* Earnings Section */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Earnings</h3>
          <button 
            type="button" 
            onClick={() => setEarningsOpen(!earningsOpen)}
            className="focus:outline-none"
          >
            <svg 
              className={`w-6 h-6 transform ${earningsOpen ? 'rotate-180' : ''} transition-transform`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Earnings Content */}
        {earningsOpen && (
          <div className="space-y-4">
            {/* List of current earnings */}
            {earnings.length > 0 && (
              <div className="mt-4 mb-6">
                <table className="w-full border-collapse border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 uppercase tracking-wider">
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">End Date</th>
                      <th className="border p-2 text-left">Amount</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((item, index) => (
                      <tr key={index} className="border-gray-200 text-gray-700 hover:bg-gray-100">
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.effectiveDate}</td>
                        <td className="border p-2">{item.endDate || 'N/A'}</td>
                        <td className="border p-2">{item.calculatedAmount}</td>
                        <td className="border p-2 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem('earnings', index)}
                            className="text-blue-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Add new earnings */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              <select
                className="border border-gray-200 p-2 rounded shadow-sm bg-white"
                onChange={(e) => handleOpenAddModal('earnings', parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>Select Earnings Type</option>
                {earningTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.earningsType} - {type.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'} {type.mode ? `(${type.mode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Deductions Section */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Deductions</h3>
          <button 
            type="button" 
            onClick={() => setDeductionsOpen(!deductionsOpen)}
            className="focus:outline-none"
          >
            <svg 
              className={`w-6 h-6 transform ${deductionsOpen ? 'rotate-180' : ''} transition-transform`} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Deductions Content */}
        {deductionsOpen && (
          <div className="space-y-4">
            {/* List of current deductions */}
            {deductions.length > 0 && (
              <div className="mt-4 mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 uppercase tracking-wider">
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">End Date</th>
                      <th className="border p-2 text-left">Amount</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductions.map((item, index) => (
                      <tr key={index} className="border-gray-200 text-gray-700 hover:bg-gray-100">
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.effectiveDate}</td>
                        <td className="border p-2">{item.endDate || 'N/A'}</td>
                        <td className="border p-2">{item.calculatedAmount}</td>
                        <td className="border p-2 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem('deductions', index)}
                            className="text-blue-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Add new deduction */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              <select
                className="border border-gray-200 p-2 rounded shadow-sm bg-white"
                onChange={(e) => handleOpenAddModal('deductions', parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>Select Deduction Type</option>
                {deductionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.deductionType} - {type.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'} {type.mode ? `(${type.mode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden inputs to store earnings and deductions data */}
      <input type="hidden" {...register('earnings')} value={JSON.stringify(earnings)} />
      <input type="hidden" {...register('deductions')} value={JSON.stringify(deductions)} />
      
      {/* Navigation Buttons */}
      {handleBack && onFormSubmit && (
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-md transition duration-200"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit(onFormSubmit)}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-md transition duration-200"
          >
            Submit
          </button>
        </div>
      )}
      
      {/* Modal for adding new item */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'earnings' ? 'Add Earnings' : 'Add Deduction'}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {modalType === 'earnings' ? 'Earnings' : 'Deduction'} Name
              </label>
              <input
                type="text"
                value={selectedItemDetails.name}
                disabled
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={selectedItemDetails.effectiveDate}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={selectedItemDetails.endDate}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
          {/* Dynamic fields based on calculation method and mode */}
          {renderAmountFields()}
                      
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error notification for API calls */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalDetailsForm;