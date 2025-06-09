'use client';
import { useState } from 'react';

export default function EarningsTable({ earnings = [], onEarningsChange }) {
  const [editingEarning, setEditingEarning] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Handle opening edit modal
  const handleEditClick = (earning) => {
    setEditingEarning(earning);
    setShowEditModal(true);
  };

  // Handle close edit modal
  const handleCloseEdit = () => {
    setEditingEarning(null);
    setShowEditModal(false);
  };

  // Handle saving edits
  const handleSaveEdit = (updatedEarning) => {
    const updatedEarnings = earnings.map(earning => 
      earning.id === updatedEarning.id ? updatedEarning : earning
    );
    onEarningsChange(updatedEarnings);
    setShowEditModal(false);
  };

  // Get human-readable calculation method
  const getCalculationMethodText = (method) => {
    switch(method) {
      case 'fixed_amount': return 'Fixed Amount';
      case 'percentage': return 'Percentage';
      default: return method;
    }
  };

  // Get human-readable mode
  const getModeText = (mode) => {
    switch(mode) {
      case 'monthly': return 'Monthly';
      case 'hourly': return 'Hourly';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return mode;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Calculation Method
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mode
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tax Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {earnings.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                No earnings found.
              </td>
            </tr>
          ) : (
            earnings.map((earning, index) => (
              <tr key={`earning-${earning.id}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {index + 1}.
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {earning.earningsType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getCalculationMethodText(earning.calculationMethod)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getModeText(earning.mode) || 'Monthly'} 
                </td>
                <td className="p-3 py-4">{earning.isTaxable ? 'Taxable' : 'Non-Taxable'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    earning.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {earning.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(earning)}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label="Edit earning"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showEditModal && editingEarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Earning</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                
                // Create updated earning object with proper backend values
                const formData = {
                  ...editingEarning,
                  earningsType: e.target.earningsType.value,
                  // Only name can be edited, other properties like calculationMethod can't be changed
                  isTaxable: e.target.isTaxable.value === 'true',
                  status: e.target.status.value
                };
                
                handleSaveEdit(formData);
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  readOnly
                  name="earningsType"
                  defaultValue={editingEarning.earningsType}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm"
                />
              </div>

              {/* Calculation Method - Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                <input
                  type="text"
                  readOnly
                  value={getCalculationMethodText(editingEarning.calculationMethod)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm"
                />
              </div>

              {/* Mode - Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mode</label>
                <input
                  type="text"
                  readOnly
                  value={getModeText(editingEarning.mode)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-md shadow-sm"
                />
              </div>

              {/* Taxable Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Status</label>
                <select
                  name="isTaxable"
                  defaultValue={editingEarning.isTaxable}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="true">Taxable</option>
                  <option value="false">Non-Taxable</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  defaultValue={editingEarning.status}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-between space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEdit}
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
      )}
    </div>
  );
}