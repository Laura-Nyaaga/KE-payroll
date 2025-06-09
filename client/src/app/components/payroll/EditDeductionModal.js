'use client';

import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { updateEmployeeDeduction } from '../utils/deductionsApi'; 

export default function EditDeductionModal({ deduction, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customMonthlyAmount: deduction.customMonthlyAmount || '',
    customPercentage: deduction.customPercentage || '',
    status: deduction.status, 
    effectiveDate: deduction.effectiveDate || '',
    endDate: deduction.endDate || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const dataToSend = {
        status: formData.status,
        effectiveDate: formData.effectiveDate,
        endDate: formData.endDate || null
      };

      if (deduction.deduction.calculationMethod === 'fixed_amount') {
        dataToSend.customMonthlyAmount = formData.customMonthlyAmount !== '' ? parseFloat(formData.customMonthlyAmount) : null;
      } else if (deduction.deduction.calculationMethod === 'percentage') {
        dataToSend.customPercentage = formData.customPercentage !== '' ? parseFloat(formData.customPercentage) : null;
      }

      await updateEmployeeDeduction(deduction.id, dataToSend); 
      toast.success('Deduction updated successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to update deduction:', err);
      toast.error(err.response?.data?.message || 'Failed to update deduction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Edit Deduction</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deduction Type
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={deduction.deduction.deductionType}
              readOnly
            />
          </div>

          {deduction.deduction.calculationMethod === 'fixed_amount' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                name="customMonthlyAmount"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.customMonthlyAmount}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          )}

          {deduction.deduction.calculationMethod === 'percentage' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage
              </label>
              <input
                type="number"
                name="customPercentage"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.customPercentage}
                onChange={handleChange}
                step="0.01"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              name="effectiveDate"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.effectiveDate}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.endDate || ''}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}