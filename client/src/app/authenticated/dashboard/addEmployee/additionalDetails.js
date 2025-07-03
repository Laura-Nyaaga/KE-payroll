'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import api, { BASE_URL } from '../../../config/api';

const AdditionalDetailsForm = ({ handleBack }) => {
  const router = useRouter();
  const { register, handleSubmit, setValue } = useFormContext();

  // State for storing earnings and deductions added by the user
  const [assignedItems, setAssignedItems] = useState({
    earnings: [],
    deductions: [],
  });

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
  const [modalType, setModalType] = useState(''); // 'earnings' or 'deductions'
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editIndex, setEditIndex] = useState(null); // Index of item being edited
  const [selectedTypeItem, setSelectedTypeItem] = useState(null); // The selected earning/deduction type from API
  const [modalInputDetails, setModalInputDetails] = useState({
    effectiveDate: new Date().toISOString().split('T')[0], // Default to today
    endDate: '',
    customPercentage: '',
    customMonthlyAmount: '',
    customNumberOfHours: '',
    customHourlyRate: '',
    customNumberOfDays: '',
    customDailyRate: '',
    customNumberOfWeeks: '',
    customWeeklyRate: '',
  });

  // Refs for select elements to reset them
  const earningsSelectRef = useRef(null);
  const deductionsSelectRef = useRef(null);

  // Effect to update react-hook-form whenever assignedItems changes
  useEffect(() => {
    setValue('earnings', assignedItems.earnings, { shouldValidate: false, shouldDirty: false });
    setValue('deductions', assignedItems.deductions, { shouldValidate: false, shouldDirty: false });
  }, [assignedItems, setValue]);

  useEffect(() => {
  console.log('AdditionalDetailsForm mounted');
  return () => console.log('AdditionalDetailsForm unmounted');
}, []);

  // Fetch earnings and deduction types from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          throw new Error('Company ID not found in local storage. Please log in again.');
        }

        const earningsResponse = await api.get(`${BASE_URL}/earnings/company/${companyId}`);
        setEarningTypes(earningsResponse.data);

        const deductionResponse = await api.get(`${BASE_URL}/deductions/company/${companyId}`);
        setDeductionTypes(deductionResponse.data);
      } catch (err) {
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
    let itemFromTypes = null;
    if (type === 'earnings') {
      itemFromTypes = earningTypes.find((item) => item.id === itemId);
    } else {
      itemFromTypes = deductionTypes.find((item) => item.id === itemId);
    }

    if (!itemFromTypes) return;

    setSelectedTypeItem(itemFromTypes);
    setModalType(type);
    setModalMode('add');
    setEditIndex(null);

    // Reset modal inputs
    let initialCustomValues = {
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      customPercentage: '',
      customMonthlyAmount: '',
      customNumberOfHours: '',
      customHourlyRate: '',
      customNumberOfDays: '',
      customDailyRate: '',
      customNumberOfWeeks: '',
      customWeeklyRate: '',
    };

    // Pre-fill based on calculationMethod and mode
    if (itemFromTypes.calculationMethod === 'percentage') {
      initialCustomValues.customPercentage = itemFromTypes.fixedAmount || '';
    } else if (itemFromTypes.calculationMethod === 'fixed_amount') {
      switch (itemFromTypes.mode) {
        case 'monthly':
          initialCustomValues.customMonthlyAmount = itemFromTypes.fixedAmount || '';
          break;
        case 'hourly':
          initialCustomValues.customHourlyRate = itemFromTypes.fixedAmount || '';
          initialCustomValues.customNumberOfHours = '';
          break;
        case 'daily':
          initialCustomValues.customDailyRate = itemFromTypes.fixedAmount || '';
          initialCustomValues.customNumberOfDays = '';
          break;
        case 'weekly':
          initialCustomValues.customWeeklyRate = itemFromTypes.fixedAmount || '';
          initialCustomValues.customNumberOfWeeks = '';
          break;
        default:
          initialCustomValues.customMonthlyAmount = itemFromTypes.fixedAmount || '';
          break;
      }
    }
    setModalInputDetails(initialCustomValues);
    setModalOpen(true);
  };

  // Open modal to edit existing item
  const handleEditItem = (type, index) => {
    const item = assignedItems[type][index];
    const itemFromTypes = type === 'earnings'
      ? earningTypes.find((t) => t.id === item.id)
      : deductionTypes.find((t) => t.id === item.id);

    if (!itemFromTypes) return;

    setSelectedTypeItem(itemFromTypes);
    setModalType(type);
    setModalMode('edit');
    setEditIndex(index);
    setModalInputDetails({
      effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
      endDate: item.endDate || '',
      customPercentage: item.details.customPercentage || '',
      customMonthlyAmount: item.details.customMonthlyAmount || '',
      customNumberOfHours: item.details.customNumberOfHours || '',
      customHourlyRate: item.details.customHourlyRate || '',
      customNumberOfDays: item.details.customNumberOfDays || '',
      customDailyRate: item.details.customDailyRate || '',
      customNumberOfWeeks: item.details.customNumberOfWeeks || '',
      customWeeklyRate: item.details.customWeeklyRate || '',
    });
    setModalOpen(true);
  };

  // Close modal and reset state
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTypeItem(null);
    setModalMode('add');
    setEditIndex(null);
    setModalInputDetails({
      effectiveDate: new Date().toISOString().split('T')[0],
      endDate: '',
      customPercentage: '',
      customMonthlyAmount: '',
      customNumberOfHours: '',
      customHourlyRate: '',
      customNumberOfDays: '',
      customDailyRate: '',
      customNumberOfWeeks: '',
      customWeeklyRate: '',
    });
    // Reset select dropdowns
    if (earningsSelectRef.current) earningsSelectRef.current.value = '';
    if (deductionsSelectRef.current) deductionsSelectRef.current.value = '';
  };

  // Handle input change in modal
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalInputDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate the amount dynamically based on selected type and modal inputs
  const calculateAmount = useCallback(() => {
    if (!selectedTypeItem) return '0.00';

    const { calculationMethod, mode } = selectedTypeItem;
    const {
      customPercentage,
      customMonthlyAmount,
      customNumberOfHours,
      customHourlyRate,
      customNumberOfDays,
      customDailyRate,
      customNumberOfWeeks,
      customWeeklyRate,
    } = modalInputDetails;

    let calculated = 0;

    if (calculationMethod === 'percentage') {
      const percentageValue = parseFloat(customPercentage || 0);
      return `${percentageValue.toFixed(2)}%`;
    } else if (calculationMethod === 'fixed_amount') {
      switch (mode) {
        case 'monthly':
          calculated = parseFloat(customMonthlyAmount || 0);
          break;
        case 'hourly':
          const hours = parseFloat(customNumberOfHours || 0);
          const hourlyRate = parseFloat(customHourlyRate || 0);
          calculated = hours * hourlyRate;
          break;
        case 'daily':
          const days = parseFloat(customNumberOfDays || 0);
          const dailyRate = parseFloat(customDailyRate || 0);
          calculated = days * dailyRate;
          break;
        case 'weekly':
          const weeks = parseFloat(customNumberOfWeeks || 0);
          const weeklyRate = parseFloat(customWeeklyRate || 0);
          calculated = weeks * weeklyRate;
          break;
        default:
          calculated = parseFloat(customMonthlyAmount || 0);
          break;
      }
    }
    return parseFloat(calculated).toFixed(2);
  }, [selectedTypeItem, modalInputDetails]);

  // Handle saving the item from modal to assignedItems state
  const handleSaveModal = () => {
    if (!selectedTypeItem) return;

    const currentCalculatedAmount = calculateAmount();

    const newItem = {
      type: modalType,
      id: selectedTypeItem.id,
      name: modalType === 'earnings' ? selectedTypeItem.earningsType : selectedTypeItem.deductionType,
      effectiveDate: modalInputDetails.effectiveDate,
      endDate: modalInputDetails.endDate || null,
      calculationMethod: selectedTypeItem.calculationMethod,
      mode: selectedTypeItem.mode,
      fixedAmount: selectedTypeItem.fixedAmount || null,
      calculatedAmount: currentCalculatedAmount,
      details: { ...modalInputDetails },
    };

    setAssignedItems((prev) => {
      if (modalMode === 'edit' && editIndex !== null) {
        // Update existing item
        const updatedItems = [...prev[modalType]];
        updatedItems[editIndex] = newItem;
        return { ...prev, [modalType]: updatedItems };
      } else {
        // Add new item
        return { ...prev, [modalType]: [...prev[modalType], newItem] };
      }
    });
  setValue('earnings', assignedItems.earnings, { shouldValidate: false, shouldDirty: false });
  setValue('deductions', assignedItems.deductions, { shouldValidate: false, shouldDirty: false });
    handleCloseModal();
  };

  // Handle removing an item
  const handleRemoveItem = (type, index) => {
    setAssignedItems((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  // Render the appropriate input fields based on calculation method and mode
  const renderAmountFields = () => {
    if (!selectedTypeItem) return null;

    const { calculationMethod, mode, fixedAmount } = selectedTypeItem;

    if (calculationMethod === 'percentage') {
      return (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Custom Percentage (%)
          </label>
          <input
            type="number"
            name="customPercentage"
            value={modalInputDetails.customPercentage}
            onChange={handleModalInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            step="0.01"
            min="0"
            max="100"
            placeholder={fixedAmount ? `Default: ${fixedAmount}%` : 'Enter percentage'}
          />
          {fixedAmount && (
            <p className="text-sm text-gray-500 mt-1">Default percentage from type: {fixedAmount}%</p>
          )}
        </div>
      );
    } else if (calculationMethod === 'fixed_amount') {
      switch (mode) {
        case 'monthly':
          return (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Monthly Amount
              </label>
              <input
                type="number"
                name="customMonthlyAmount"
                value={modalInputDetails.customMonthlyAmount}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                step="0.01"
                min="0"
                placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter monthly amount'}
              />
              {fixedAmount && (
                <p className="text-sm text-gray-500 mt-1">Default amount from type: {fixedAmount}</p>
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
                  value={modalInputDetails.customNumberOfHours}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 160"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb- Nine">
                  Rate per Hour
                </label>
                <input
                  type="number"
                  name="customHourlyRate"
                  value={modalInputDetails.customHourlyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter hourly rate'}
                />
                {fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate from type: {fixedAmount}</p>
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
                  value={modalInputDetails.customNumberOfDays}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 20"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Custom Daily Rate
                </label>
                <input
                  type="number"
                  name="customDailyRate"
                  value={modalInputDetails.customDailyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter daily rate'}
                />
                {fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate from type: {fixedAmount}</p>
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
                  value={modalInputDetails.customNumberOfWeeks}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 4"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Custom Weekly Rate
                </label>
                <input
                  type="number"
                  name="customWeeklyRate"
                  value={modalInputDetails.customWeeklyRate}
                  onChange={handleModalInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="0.01"
                  min="0"
                  placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter weekly rate'}
                />
                {fixedAmount && (
                  <p className="text-sm text-gray-500 mt-1">Default rate from type: {fixedAmount}</p>
                )}
              </div>
            </>
          );
        default:
          return (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Custom Amount
              </label>
              <input
                type="number"
                name="customMonthlyAmount"
                value={modalInputDetails.customMonthlyAmount}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                step="0.01"
                min="0"
                placeholder={fixedAmount ? `Default: ${fixedAmount}` : 'Enter amount'}
              />
              {fixedAmount && (
                <p className="text-sm text-gray-500 mt-1">Default amount from type: {fixedAmount}</p>
              )}
            </div>
          );
      }
    }
    return null;
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
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {earningsOpen && (
          <div className="space-y-4">
            {assignedItems.earnings.length > 0 && (
              <div className="mt-4 mb-6 overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 uppercase text-xs tracking-wider">
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Method</th>
                      <th className="border p-2 text-left">Mode</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">End Date</th>
                      <th className="border p-2 text-left">Amount</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedItems.earnings.map((item, index) => (
                      <tr key={index} className="border-gray-200 text-gray-700 text-sm hover:bg-gray-100">
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                        <td className="border p-2">{item.mode || 'N/A'}</td>
                        <td className="border p-2">{item.effectiveDate}</td>
                        <td className="border p-2">{item.endDate || 'N/A'}</td>
                        <td className="border p-2">KSH {item.calculatedAmount}</td>
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditItem('earnings', index)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 inline-block"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-6.586 6.586a1 1 0 01-.293.207l-4 1a1 1 0 01-1.207-1.207l1-4a1 1 0 01.207-.293l6.586-6.586zM12.172 2.172a4 4 0 015.656 5.656L12 13.414 10.586 14l-1 4 4-1 5.586-5.586a4 4 0 01-5.656-5.656l5.586 5.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('earnings', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 inline-block"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-4">
              <select
                ref={earningsSelectRef}
                className="border border-gray-200 p-2 rounded shadow-sm bg-white"
                onChange={(e) => handleOpenAddModal('earnings', parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Earnings Type
                </option>
                {earningTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.earningsType} - {type.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}{' '}
                    {type.mode ? `(${type.mode})` : ''}
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
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {deductionsOpen && (
          <div className="space-y-4">
            {assignedItems.deductions.length > 0 && (
              <div className="mt-4 mb-6 overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-gray-500 uppercase text-xs tracking-wider">
                      <th className="border p-2 text-left">Name</th>
                      <th className="border p-2 text-left">Method</th>
                      <th className="border p-2 text-left">Mode</th>
                      <th className="border p-2 text-left">Effective Date</th>
                      <th className="border p-2 text-left">End Date</th>
                      <th className="border p-2 text-left">Amount</th>
                      <th className="border p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedItems.deductions.map((item, index) => (
                      <tr key={index} className="border-gray-200 text-gray-700 text-sm hover:bg-gray-100">
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                        <td className="border p-2">{item.mode || 'N/A'}</td>
                        <td className="border p-2">{item.effectiveDate}</td>
                        <td className="border p-2">{item.endDate || 'N/A'}</td>
                        <td className="border p-2">KSH {item.calculatedAmount}</td>
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEditItem('deductions', index)}
                            className="text-blue-500 hover:text-blue-700 mr-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 inline-block"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-6.586 6.586a1 1 0 01-.293.207l-4 1a1 1 0 01-1.207-1.207l1-4a1 1 0 01.207-.293l6.586-6.586zM12.172 2.172a4 4 0 015.656 5.656L12 13.414 10.586 14l-1 4 4-1 5.586-5.586a4 4 0 01-5.656-5.656l5.586 5.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem('deductions', index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 inline-block"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-4">
              <select
                ref={deductionsSelectRef}
                className="border border-gray-200 p-2 rounded shadow-sm bg-white"
                onChange={(e) => handleOpenAddModal('deductions', parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Deduction Type
                </option>
                {deductionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.deductionType} - {type.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed'}{' '}
                    {type.mode ? `(${type.mode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Modal for adding/editing item */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'earnings' ? (modalMode === 'edit' ? 'Edit Earnings' : 'Add Earnings') : (modalMode === 'edit' ? 'Edit Deduction' : 'Add Deduction')}
            </h2>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {modalType === 'earnings' ? 'Earnings' : 'Deduction'} Type
              </label>
              <input
                type="text"
                value={modalType === 'earnings' ? selectedTypeItem.earningsType : selectedTypeItem.deductionType}
                disabled
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Calculation Method
              </label>
              <input
                type="text"
                value={selectedTypeItem.calculationMethod === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                disabled
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
              />
            </div>

            {selectedTypeItem.mode && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Mode
                </label>
                <input
                  type="text"
                  value={selectedTypeItem.mode.charAt(0).toUpperCase() + selectedTypeItem.mode.slice(1)}
                  disabled
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Effective Date
              </label>
              <input
                type="date"
                name="effectiveDate"
                value={modalInputDetails.effectiveDate}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                value={modalInputDetails.endDate}
                onChange={handleModalInputChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            {renderAmountFields()}

            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <label className="block text-blue-800 text-sm font-bold mb-1">
                Calculated Amount
              </label>
              <input
                type="text"
                value={`KSH ${calculateAmount()}`}
                readOnly
                className="shadow appearance-none border rounded w-full py-2 px-3 text-blue-900 leading-tight bg-blue-100 font-semibold"
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                {modalMode === 'edit' ? 'Save Changes' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          <div className="flex">
            <div className="py-1">
              <svg
                className="h-6 w-6 text-red-500 mr-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
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


