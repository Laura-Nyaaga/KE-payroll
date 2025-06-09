'use client';
import { useState, useEffect } from 'react';

export default function AddDeductionModal({ onClose, onAdd }) {
  const [companyId, setCompanyId] = useState(null);
  const [deductionData, setDeductionData] = useState({
    deductionType: '',
    calculationMethod: 'fixed_amount',
    mode: 'monthly',
    isTaxable: true,
    startDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get companyId when component mounts
  useEffect(() => {
    const id = localStorage.getItem('companyId');
    if (id) {
      setCompanyId(parseInt(id));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setDeductionData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // If calculation method changes, enforce validation rule
    if (name === 'calculationMethod') {
      if (value === 'percentage') {
        setDeductionData(prev => ({ ...prev, mode: 'monthly' }));
      }
    }
    
    // Clear any errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!deductionData.deductionType.trim()) {
      newErrors.deductionType = 'Deduction type is required';
    } else if (deductionData.deductionType.length < 2 || deductionData.deductionType.length > 100) {
      newErrors.deductionType = 'Deduction type must be between 2-100 characters';
    }
    
    if (!deductionData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    // Enforce percentage validation rule
    if (deductionData.calculationMethod === 'percentage' && deductionData.mode !== 'monthly') {
      newErrors.mode = 'Percentage-based deductions must have "monthly" mode';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    if (!companyId) {
      setErrors({ form: 'Company ID is missing. Please refresh and try again.' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const submitData = {
        ...deductionData,
        companyId: companyId
      };
      
      await onAdd(submitData);
      onClose();
    } catch (error) {
      console.error('Error adding deduction:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: error.response?.data?.message || error.message || 'Failed to add deduction. Please try again.' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Deduction</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {errors.form}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Deduction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Deduction Type *</label>
            <input
              type="text"
              name="deductionType"
              value={deductionData.deductionType}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${errors.deductionType ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500`}
              placeholder="Enter deduction type"
            />
            {errors.deductionType && (
              <p className="mt-1 text-sm text-red-600">{errors.deductionType}</p>
            )}
          </div>
          
          {/* Calculation Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Calculation Method *</label>
            <select
              name="calculationMethod"
              value={deductionData.calculationMethod}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
            >
              <option value="fixed_amount">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
          
          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mode *</label>
            <select
              name="mode"
              value={deductionData.mode}
              onChange={handleChange}
              disabled={deductionData.calculationMethod === 'percentage'}
              className={`mt-1 block w-full px-3 py-2 border ${errors.mode ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 ${
                deductionData.calculationMethod === 'percentage' ? 'bg-gray-100' : ''
              }`}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="hourly">Hourly</option>
            </select>
            {deductionData.calculationMethod === 'percentage' && (
              <p className="text-xs text-gray-500 mt-1">Percentage-based deductions must use monthly mode</p>
            )}
            {errors.mode && (
              <p className="mt-1 text-sm text-red-600">{errors.mode}</p>
            )}
          </div>
          
          {/* Taxable */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isTaxable"
              id="isTaxable"
              checked={deductionData.isTaxable}
              onChange={handleChange}
              className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
            />
            <label htmlFor="isTaxable" className="ml-2 block text-sm text-gray-700">
              Taxable
            </label>
          </div>
          
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={deductionData.startDate}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border ${errors.startDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>
          
          {/* Status (hidden field since it defaults to active) */}
          <input type="hidden" name="status" value="active" />
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:bg-cyan-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Deduction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}