'use client';
import { useState } from 'react';
import React from 'react';

export default function DeductionsTable({ deductions = [], onDeductionsChange }) {
  const [editingDeduction, setEditingDeduction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Handle status toggle
  const handleToggleStatus = (index) => {
    const updatedDeductions = [...deductions];
    updatedDeductions[index].status = updatedDeductions[index].status === 'active' ? 'inactive' : 'active';
    onDeductionsChange(updatedDeductions);
  };

  // Handle opening edit modal
  const handleEditClick = (deduction) => {
    setEditingDeduction(deduction);
    setShowEditModal(true);
  };

  // Handle close edit modal
  const handleCloseEdit = () => {
    setEditingDeduction(null);
    setShowEditModal(false);
  };

  // Handle saving edits
  const handleSaveEdit = (updatedDeduction) => {
    const updatedDeductions = deductions.map(deduction => 
      deduction.id === updatedDeduction.id ? updatedDeduction : deduction
    );
    onDeductionsChange(updatedDeductions);
    setShowEditModal(false);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      {apiError && (
        <div className="p-4 bg-red-50 text-red-600 border-b border-gray-200">
          <p>Error loading options: {apiError}</p>
        </div>
      )}
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deduction Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculation Method</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {deductions.length > 0 ? (
            deductions.map((deduction, index) => (
              <tr key={deduction.id || `deduction-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{index + 1}.</td>
                <td className="px-6 py-4 whitespace-nowrap">{deduction.deductionType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {deduction.calculationMethod === 'fixed_amount' ? 'Fixed Amount' : 'Percentage'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{deduction.mode || 'Monthly'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {deduction.isTaxable ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => handleToggleStatus(index)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                      deduction.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {deduction.status}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(deduction)}
                    className="text-gray-600 hover:text-gray-900 mr-3"
                    aria-label="Edit deduction"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                No deductions found
              </td>
            </tr>
          )}
        </tbody>
      </table>

{/* Edit Modal */}
{showEditModal && editingDeduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Deduction</h2>
              <button onClick={handleCloseEdit} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = {
                  ...editingDeduction,
                  // No longer collecting these values from form inputs
                  // as they should remain unchanged
                  isTaxable: e.target.isTaxable.checked,
                  status: e.target.status.value,
                  startDate: e.target.startDate.value,
                };
                handleSaveEdit(formData);
              }}
              className="space-y-4"
            >
              {/* Deduction Type - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Deduction Type</label>
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                  {editingDeduction.deductionType}
                </div>
                <p className="text-xs text-gray-500 mt-1">Cannot be modified after creation</p>
              </div>

              {/* Calculation Method - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                  {editingDeduction.calculationMethod === 'fixed_amount' ? 'Fixed Amount' : 'Percentage'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Cannot be modified after creation</p>
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700">Mode</label>
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                {editingDeduction.mode ? (
                  editingDeduction.mode.charAt(0).toUpperCase() + editingDeduction.mode.slice(1)
                ) : (
                  'Not set'
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Cannot be modified after creation</p>
            </div>

              {/* Taxable */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isTaxable"
                  defaultChecked={editingDeduction.isTaxable}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">Taxable</label>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status *</label>
                <select
                  name="status"
                  defaultValue={editingDeduction.status}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={editingDeduction.startDate ? editingDeduction.startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}