'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function AddUser({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check user role for authorization
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && ['SuperAdmin', 'Hr'].includes(user.role)) {
        setIsAuthorized(true);
      } else {
        toast.error('Unauthorized: Only SuperAdmin or HR can add users');
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      toast.error('Unauthorized: Invalid user data');
    }
  }, []);

  // Real-time validation for individual fields
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'firstName' || name === 'lastName') {
      if (!value.trim()) {
        newErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
      } else if (value.length < 2 || value.length > 50) {
        newErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be 2–50 characters`;
      } else {
        delete newErrors[name];
      }
    }

    if (name === 'middleName' && value && value.length > 50) {
      newErrors.middleName = 'Middle name must be 1–50 characters';
    } else if (name === 'middleName') {
      delete newErrors.middleName;
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(value)) {
        newErrors.email = 'Enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (name === 'phoneNumber') {
      const phoneRegex = /^\+?\d{9,14}$/;
      if (!value.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!phoneRegex.test(value)) {
        newErrors.phoneNumber = 'Phone number must be 10–15 digits, may start with +';
      } else {
        delete newErrors.phoneNumber;
      }
    }

    if (name === 'password') {
      if (!value) {
        newErrors.password = 'Password is required';
      } else if (value.length < 8 || value.length > 16) {
        newErrors.password = 'Password must be 8–16 characters';
      } else {
        delete newErrors.password;
      }
      // Re-validate confirmPassword if password changes
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        newErrors.confirmPassword = 'Confirm password is required';
      } else if (value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'role') {
      if (!value) {
        newErrors.role = 'Role is required';
      } else if (!['SuperAdmin', 'Hr', 'HrAdmin', 'Accountant', 'Manager'].includes(value)) {
        newErrors.role = 'Invalid role selected';
      } else {
        delete newErrors.role;
      }
    }

    setErrors(newErrors);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    // Convert names to title case
    if (['firstName', 'middleName', 'lastName'].includes(name)) {
      processedValue = value
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace(/\s+/g, ' ')
        .trimStart();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Validate field in real-time
    validateField(name, processedValue);
  };

  // Full form validation before submission
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2 || formData.firstName.length > 50) {
      newErrors.firstName = 'First name must be 2–50 characters';
    }

    if (formData.middleName && formData.middleName.length > 50) {
      newErrors.middleName = 'Middle name must be 1–50 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2 || formData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be 2–50 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?\d{9,14}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10–15 digits, may start with +';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8 || formData.password.length > 16) {
      newErrors.password = 'Password must be 8–16 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    } else if (!['SuperAdmin', 'Hr', 'HrAdmin', 'Accountant', 'Manager'].includes(formData.role)) {
      newErrors.role = 'Invalid role selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      toast.error('Unauthorized: Only SuperAdmin or HR can add users', {
        style: {
          background: '#fef2f2',
          color: '#b91c1c',
        },
      });
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        style: {
          background: '#fef2f2',
          color: '#b91c1c',
        },
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAdd(formData);
      if (result && result.success) {
        toast.success('User added successfully!', {
          style: {
            background: '#ecfdf5',
            color: '#065f46',
          },
        });
        onClose();
      } else {
        throw new Error(result?.message || 'Failed to add user');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add user', {
        style: {
          background: '#fef2f2',
          color: '#b91c1c',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
          <h3 className="text-lg font-bold mb-2">Access Denied</h3>
          <p className="text-red-600 mb-4">Only SuperAdmin or HR can add users.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add a New User</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
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
              className="h-6 w-6"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="First Name"
                required
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.middleName ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="Middle Name"
              />
              {errors.middleName && (
                <p className="mt-1 text-sm text-red-600">{errors.middleName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="Last Name"
                required
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="Email"
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="Phone Number"
                required
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}}`}
                  aria-label="Password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  aria-label="Confirm Password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                aria-label="Role"
                required
              >
                <option value="">Select Role</option>
                <option value="SuperAdmin">Super Admin</option>
                <option value="HrAdmin">HR Admin</option>
                <option value="Hr">HR</option>
                <option value="Accountant">Accountant</option>
                <option value="Manager">Manager</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                aria-label="Status"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-evenly gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-400 text-white rounded hover:bg-cyan-500 transition disabled:bg-cyan-200"
                disabled={isSubmitting || Object.keys(errors).length > 0}
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}