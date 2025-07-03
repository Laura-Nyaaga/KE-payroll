'use client';
import { useState } from 'react';

export default function AddJobTitle({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      name,
      description,
      status: 'Active'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Job Title</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const inputValue = e.target.value;
                const titleCaseValue = inputValue
                  .toLowerCase()
                  .replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
                setName(titleCaseValue);
              }}
              className="w-full p-2 border rounded"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
              required
            />
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