'use client';
import { useState } from 'react';

const calculationOptions = ["Monthly", "Weekly", "Daily", "Hourly", "Per Day", "Fixed"];
const taxableOptions = ["Taxable", "Non-Taxable"];

export default function AllowancesTable({ allowances, onEditClick, handleUpdateAllowances }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  
  const handleOpenEdit = (allowance) => {
    setEditingAllowance(allowance);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingAllowance(null);
  };

  const handleSaveEdit = async (updatedData) => {
    const updatedList = allowances.map((a) => (a.id === updatedData.id ? updatedData : a));
    await handleUpdateAllowances(updatedList);
    handleCloseEdit();
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
              Tax Status
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {allowances.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                No allowances found. Click "Add Allowance" to create a new allowance.
              </td>
            </tr>
          ) : (
            allowances.map((allowance, index) => (
              <tr key={allowance.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {index + 1}.
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {allowance.allowanceType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {allowance.calculationMethod}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    allowance.isTaxable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {allowance.isTaxable ? 'Taxable' : 'Non-Taxable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenEdit(allowance)}
                    className="text-gray-600 hover:text-gray-900"
                    aria-label="Edit allowance"
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
      {showEditModal && editingAllowance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Allowance</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = {
                  ...editingAllowance,
                  allowanceType: e.target.allowanceType?.value,
                  calculationMethod: e.target.calculationMethod?.value,
                  amount: e.target.amount?.value || null,
                  percentage: e.target.percentage?.value || null,
                  startDate: e.target.startDate?.value,
                  endDate: e.target.endDate?.value,
                  isTaxable: e.target.isTaxable?.checked,
                };
                handleSaveEdit(formData);
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowance Type</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700">
                  {editingAllowance.allowanceType || '—'}
                </div>
              </div>

              {/* Calculation Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                <select
                  name="calculationMethod"
                  defaultValue={editingAllowance.calculationMethod}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="fixed_amount">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              {/* Amount / Percentage */}
              {editingAllowance.calculationMethod === 'fixed_amount' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingAllowance.amount}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              )}
              {editingAllowance.calculationMethod === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage</label>
                  <input
                    type="number"
                    name="percentage"
                    defaultValue={editingAllowance.percentage}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={editingAllowance.startDate?.split('T')[0]}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={editingAllowance.endDate?.split('T')[0]}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Is Taxable */}
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700">Tax Status</label>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAllowance({
                      ...editingAllowance,
                      isTaxable: !editingAllowance.isTaxable
                    });
                  }}
                  className={`px-3 py-1 text-sm rounded-full ${
                    editingAllowance.isTaxable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {editingAllowance.isTaxable ? 'Taxable' : 'Non-Taxable'}
                </button>
                <input
                  type="checkbox"
                  name="isTaxable"
                  checked={editingAllowance.isTaxable}
                  onChange={() => {}}
                  className="hidden" // Hidden because we're using the button UI instead
                />
              </div>

              {/* Actions */}
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