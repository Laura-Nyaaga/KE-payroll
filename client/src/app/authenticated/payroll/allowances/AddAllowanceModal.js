'use client';
import { useState, useRef, useEffect } from 'react';

export default function AddAllowanceModal({ onClose, onAdd }) {
  const [newAllowance, setNewAllowance] = useState({
    companyId: '',
    allowanceType: '',
    calculationMethod: '',
    amount: '',
    percentage: '',
    isTaxable: true,
    status: 'active',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Add escape key listener
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const validateForm = () => {
    const newErrors = {};
    if (!newAllowance.allowanceType.trim()) newErrors.allowanceType = 'Allowance Type is required';
    if (!newAllowance.calculationMethod.trim()) newErrors.calculationMethod = 'Calculation Method is required';

    const hasAmount = newAllowance.amount !== '';
    const hasPercentage = newAllowance.percentage !== '';
    if (hasAmount && hasPercentage) {
      newErrors.amount = 'Only one of amount or percentage can be filled';
      newErrors.percentage = 'Only one of amount or percentage can be filled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'isTaxable') {
      setNewAllowance(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setNewAllowance(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onAdd({
        ...newAllowance,
        amount: newAllowance.amount || null,
        percentage: newAllowance.percentage || null,
        startDate: newAllowance.startDate || new Date().toISOString(),
      });
    }
  };

  const isAmountDisabled = newAllowance.calculationMethod === 'Percentage';
  const isPercentageDisabled = newAllowance.calculationMethod === 'Fixed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* This element centers the modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div 
          ref={modalRef}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Allowance</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Allowance Type</label>
                <input
                  type="text"
                  name="allowanceType"
                  value={newAllowance.allowanceType}
                  onChange={handleChange}
                  className={`mt-1 w-full p-2 border ${errors.allowanceType ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500`}
                  placeholder="E.g., Housing, Transport, Medical"
                />
                {errors.allowanceType && <p className="mt-1 text-red-600 text-sm">{errors.allowanceType}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Calculation Method</label>
                <select
                  name="calculationMethod"
                  value={newAllowance.calculationMethod}
                  onChange={handleChange}
                  className={`mt-1 w-full p-2 border ${errors.calculationMethod ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500`}
                >
                  <option value="" disabled>Select a calculation method</option>
                  <option value="Fixed">Fixed Amount</option>
                  <option value="Percentage">Percentage</option>
                </select>
                {errors.calculationMethod && <p className="mt-1 text-red-600 text-sm">{errors.calculationMethod}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newAllowance.amount}
                  onChange={handleChange}
                  className={`mt-1 w-full p-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500`}
                  disabled={isAmountDisabled}
                />
                {errors.amount && <p className="mt-1 text-red-600 text-sm">{errors.amount}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Percentage</label>
                <input
                  type="number"
                  name="percentage"
                  value={newAllowance.percentage}
                  onChange={handleChange}
                  className={`mt-1 w-full p-2 border ${errors.percentage ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500`}
                  disabled={isPercentageDisabled}
                />
                {errors.percentage && <p className="mt-1 text-red-600 text-sm">{errors.percentage}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tax Status</label>
                <select
                  name="isTaxable"
                  value={newAllowance.isTaxable.toString()}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="true">Taxable</option>
                  <option value="false">Non-Taxable</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={newAllowance.startDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={newAllowance.endDate}
                  onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-500 text-base font-medium text-white hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Add Allowance
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}