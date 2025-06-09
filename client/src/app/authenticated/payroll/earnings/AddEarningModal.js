'use client';
import { useState } from 'react';

export default function AddEarningModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    earningsType: '',
    calculationMethod: 'fixed_amount',
    mode: 'monthly',
    isTaxable: true,
    // Amount fields based on calculation method
    customMonthlyAmount: '',
    customPercentage: '',
    customHourlyRate: '',
    customDailyRate: '',
    customWeeklyRate: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({ 
      ...formData, 
      [name]: newValue 
    });
    
    if (name === 'calculationMethod') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        mode: value === 'percentage' ? 'monthly' : prev.mode
      }));
    }
    
    // Clear error when field changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.earningsType.trim()) {
      newErrors.earningsType = 'Earnings type is required';
    } else if (formData.earningsType.length < 2 || formData.earningsType.length > 100) {
      newErrors.earningsType = 'Earnings type must be between 2-100 characters';
    }
    
    if (formData.calculationMethod === 'percentage') {
      if (!formData.customPercentage) {
        newErrors.customPercentage = 'Percentage is required';
      } else if (parseFloat(formData.customPercentage) <= 0 || parseFloat(formData.customPercentage) > 100) {
        newErrors.customPercentage = 'Percentage must be between 0 and 100';
      }
    } else {
      // Validate fixed amount based on mode
      const amountField = {
        monthly: 'customMonthlyAmount',
        hourly: 'customHourlyRate',
        daily: 'customDailyRate',
        weekly: 'customWeeklyRate'
      }[formData.mode];
      
      if (!formData[amountField]) {
        newErrors[amountField] = 'Amount is required';
      } else if (parseFloat(formData[amountField]) <= 0) {
        newErrors[amountField] = 'Amount must be greater than 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Prepare data for API
    const earningData = {
      earningsType: formData.earningsType,
      calculationMethod: formData.calculationMethod,
      mode: formData.mode,
      isTaxable: formData.isTaxable
    };
    
    // Add the appropriate amount field
    if (formData.calculationMethod === 'percentage') {
      earningData.customPercentage = parseFloat(formData.customPercentage);
    } else {
      switch(formData.mode) {
        case 'monthly':
          earningData.customMonthlyAmount = parseFloat(formData.customMonthlyAmount);
          break;
        case 'hourly':
          earningData.customHourlyRate = parseFloat(formData.customHourlyRate);
          break;
        case 'daily':
          earningData.customDailyRate = parseFloat(formData.customDailyRate);
          break;
        case 'weekly':
          earningData.customWeeklyRate = parseFloat(formData.customWeeklyRate);
          break;
      }
    }
    
    onAdd(earningData);
  };

  const renderAmountFields = () => {
    if (formData.calculationMethod === 'percentage') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700">Percentage</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="customPercentage"
              min="0"
              max="100"
              step="0.01"
              value={formData.customPercentage}
              onChange={handleChange}
              className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md ${
                errors.customPercentage ? 'border-red-500' : ''
              }`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
          {errors.customPercentage && (
            <p className="mt-1 text-sm text-red-600">{errors.customPercentage}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Percentage of employee's basic salary
          </p>
        </div>
      );
    }
    
    // Fixed amount
    switch(formData.mode) {
      case 'monthly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="customMonthlyAmount"
                min="0"
                step="0.01"
                value={formData.customMonthlyAmount}
                onChange={handleChange}
                className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.customMonthlyAmount ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.customMonthlyAmount && (
              <p className="mt-1 text-sm text-red-600">{errors.customMonthlyAmount}</p>
            )}
          </div>
        );
      case 'hourly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="customHourlyRate"
                min="0"
                step="0.01"
                value={formData.customHourlyRate}
                onChange={handleChange}
                className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.customHourlyRate ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.customHourlyRate && (
              <p className="mt-1 text-sm text-red-600">{errors.customHourlyRate}</p>
            )}
          </div>
        );
      case 'daily':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Daily Rate</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="customDailyRate"
                min="0"
                step="0.01"
                value={formData.customDailyRate}
                onChange={handleChange}
                className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.customDailyRate ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.customDailyRate && (
              <p className="mt-1 text-sm text-red-600">{errors.customDailyRate}</p>
            )}
          </div>
        );
      case 'weekly':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Weekly Rate</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="customWeeklyRate"
                min="0"
                step="0.01"
                value={formData.customWeeklyRate}
                onChange={handleChange}
                className={`focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md ${
                  errors.customWeeklyRate ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.customWeeklyRate && (
              <p className="mt-1 text-sm text-red-600">{errors.customWeeklyRate}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Earning</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Earnings Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Earnings Type</label>
            <input
              type="text"
              name="earningsType"
              value={formData.earningsType}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.earningsType ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500`}
              placeholder="e.g., Bonus, Commission, Allowance"
              required
            />
            {errors.earningsType && (
              <p className="mt-1 text-sm text-red-600">{errors.earningsType}</p>
            )}
          </div>
          
          {/* Calculation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
            <select
              name="calculationMethod"
              value={formData.calculationMethod}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="fixed_amount">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          
          {/* Mode - Only show if fixed_amount */}
          {formData.calculationMethod === 'fixed_amount' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mode</label>
              <select
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          )}
          
          {/* Amount Fields - Dynamic based on calculation method and mode */}
          {renderAmountFields()}
          
          {/* Taxable Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isTaxable"
              id="isTaxable"
              checked={formData.isTaxable}
              onChange={handleChange}
              className="h-4 w-4 text-cyan-500 focus:ring-cyan-400 border-gray-300 rounded"
            />
            <label htmlFor="isTaxable" className="ml-2 block text-sm text-gray-700">
              Taxable
            </label>
          </div>
          
          {/* Modal Actions */}
          <div className="flex justify-between space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-400 text-white rounded-md hover:bg-cyan-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}