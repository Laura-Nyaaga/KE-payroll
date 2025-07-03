"use client";
import { useState } from "react";

export default function EditDepartment({
  department,
  onClose,
  onUpdate,
  onStatusChange,
}) {
  const [formData, setFormData] = useState({
    code: department.departmentCode || "",
    name: department.title || "",
    description: department.description || "",
  });
  const [errors, setErrors] = useState({});
  const [showStatusAlert, setShowStatusAlert] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.code.trim()) {
      newErrors.code = "Department code is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Department name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      const newData = {
        departmentCode: formData.code,
        title: formData.name,
        description: formData.description,
      };
      onUpdate(department.id, newData);
    }
  };

  const handleStatusToggleClick = () => {
    setShowStatusAlert(true);
  };

  const handleConfirmStatusChange = () => {
    onStatusChange();
    setShowStatusAlert(false);
  };

  const handleCancelStatusChange = () => {
    setShowStatusAlert(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Department</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={(e) => {
                const inputValue = e.target.value;
                const capitalizedValue = inputValue.replace(
                  /[a-zA-Z]/g,
                  (char) => char.toUpperCase()
                );
                handleChange({
                  target: { name: "code", value: capitalizedValue },
                });
              }}
              className={`w-full p-2 border rounded-md ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
              aria-label="Department Code"
              required
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department Name
            </label>
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
              aria-label="Department Name"
              required
              minLength={2}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>

            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  department.status === "Active"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {department.status}
              </span>

              <button
                type="button"
                onClick={handleStatusToggleClick}
                className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none"
              >
                <span
                  className={`absolute w-full h-full rounded-full ${
                    department.status === "Active"
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></span>
                <span
                  className={`absolute left-0 inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    department.status === "Active"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                ></span>
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Update
            </button>
          </div>
        </form>

        {showStatusAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-5">
              <h3 className="text-lg font-semibold mb-3">
                Confirm Status Change
              </h3>
              <p className="mb-4">
                Are you sure you want to{" "}
                {department.status === "Active" ? "inactivate" : "activate"}{" "}
                this department?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelStatusChange}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className={`px-4 py-2 text-white rounded ${
                    department.status === "Active"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {department.status === "Active" ? "Inactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
