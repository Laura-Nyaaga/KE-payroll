'use client';

import React from 'react';

const LogoutConfirmationDialog = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Confirm Logout</h2>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationDialog;
