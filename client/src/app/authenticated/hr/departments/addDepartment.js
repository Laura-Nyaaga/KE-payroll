"use client";
import { useState } from "react";

export default function AddDepartment({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      title,
      departmentCode,
      description,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Department</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Department Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Convert to title case: capitalize first letter of each word
                const titleCaseValue = inputValue
                  .toLowerCase()
                  .replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
                setTitle(titleCaseValue);
              }}
              className="w-full p-2 border rounded"
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Department Code
            </label>
            <input
              type="text"
              value={departmentCode}
              onChange={(e) => setDepartmentCode(e.target.value.toUpperCase())}
              className="w-full p-2 border rounded"
              required
              placeholder="Enter Department Code"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Department Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
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
