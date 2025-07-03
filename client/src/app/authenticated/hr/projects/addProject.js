'use client';
import { useState } from 'react';

export default function AddProject({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: '',
    projectCode: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
     if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

 const handleSubmit = (e) => {
  e.preventDefault();
  
  // Clean the data before sending
  const cleanedData = {
    ...formData,
    endDate: formData.endDate || null 
  };
  
  onAdd(cleanedData);
};

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Project Name</label>
           <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Convert to title case: capitalize first letter of each word
                const titleCaseValue = inputValue
                  .toLowerCase()
                  .replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
                handleChange({
                  target: { name: "name", value: titleCaseValue },
                });
              }}
              className={`w-full p-2 border rounded-md ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              aria-label="Region Name"
              required
              minLength={2}
              maxLength={100}
            />
            {errors.name && ( 
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Project Code</label>
            <input
              type="text"
              name="projectCode"
              value={formData.projectCode}
              onChange={(e) => {
                const inputValue = e.target.value;
                const capitalizedValue = inputValue.replace(
                  /[a-zA-Z]/g,
                  (char) => char.toUpperCase()
                );
                handleChange({
                  target: { name: "projectCode", value: capitalizedValue },
                });
              }}
              className={`w-full p-2 border rounded-md ${
                errors.projectCode ? "border-red-500" : "border-gray-300"
              }`}
              aria-label="Project Code"
              minLength={2}
              maxLength={10}
              required
            />
            {errors.projectCode && (
              <p className="mt-1 text-xs text-red-500">{errors.projectCode}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              minLength={0}
              maxLength={500}
            />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            { errors.endDate && (
              <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
              <option value="ongoing">Ongoing</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-400 text-white rounded"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
