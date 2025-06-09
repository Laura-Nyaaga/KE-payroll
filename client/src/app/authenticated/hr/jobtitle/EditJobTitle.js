'use client';
import { useState, useEffect } from 'react';

export default function EditJobTitle({ job, onClose, onUpdate, onStatusChange }) {
  useEffect(() => {
    console.log('Job object in EditJobTitle:', job);
    
    if (typeof onClose !== 'function') {
      console.error('onClose is not a function:', onClose);
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [job, onClose]);

  const handleClose = () => {
    console.log('Attempting to close modal');
    if (typeof onClose === 'function') {
      onClose();
    } else {
      console.error('onClose is not available');
      // Fallback close method if onClose isn't provided
      const modalElement = document.querySelector('.fixed.inset-0');
      if (modalElement) {
        modalElement.remove();
      }
    }
  };

  // Check for both name and title properties to handle different API responses
  const [title, setTitle] = useState(job?.title || job?.name || '');
  const [description, setDescription] = useState(job?.description || '');
  const [error, setError] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title) {
      setError('Job title is required');
      return;
    }
    
    // Create updated job object based on the structure of the original job
    const updatedData = {
      // Use the same property name that was in the original job object
      ...(job.title !== undefined ? { title } : {}),
      ...(job.name !== undefined ? { name: title } : {}),
      description
    };
    
    try {
      // Pass the job ID and updated data to the parent component
      onUpdate(job.id, updatedData);
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('An error occurred while saving. Please try again.');
    }
  };

  const isActive = job?.status === 'Active';

  // Handle background click to close modal
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackgroundClick}>
      <div className="bg-white p-6 rounded-lg w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Job Title</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Status</label>
            
            {/* Segmented Toggle Control */}
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={isActive ? onStatusChange : undefined}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  !isActive 
                    ? 'bg-red-500 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Inactive
              </button>
              <button
                type="button"
                onClick={!isActive ? onStatusChange : undefined}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border border-l-0 ${
                  isActive 
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
            </div>
            
            {/* Current Status Text */}
            <div className="mt-2 text-sm text-gray-600">
              This job title is currently <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-400 text-white rounded"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}