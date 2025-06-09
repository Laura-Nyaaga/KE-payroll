'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api, { BASE_URL } from '@/app/config/api'; // Adjust path as per your project structure
import { useRouter } from 'next/navigation'; // For redirection
import { toast } from 'react-hot-toast'; // For notifications

// A simple default user icon (SVG)
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-20 h-20 text-gray-400 mx-auto" /* Reduced icon size */
  >
    <path
      fillRule="evenodd"
      d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.623 18.623 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.438-.695z"
      clipRule="evenodd"
    />
  </svg>
);

// Eye icon for password toggle (open)
const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
  >
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path
      fillRule="evenodd"
      d="M1.323 11.447C2.811 6.976 7.027 3.75 12 3.75c4.973 0 9.189 3.226 10.677 7.697a1.125 1.125 0 010 .556c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-.556zM12 17.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z"
      clipRule="evenodd"
    />
  </svg>
);

// Eye icon for password toggle (closed)
const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
  >
    <path
      d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.28 12.822a1.125 1.125 0 010 1.056c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-1.056c.94-2.825 2.617-5.241 4.673-7.147a.75.75 0 00.1-.912l.145-.163a.75.75 0 00.007-.959 2.25 2.25 0 013.118-2.45c.189.04.375.085.558.134a.75.75 0 00.203-.006l.305-.082c.15-.04.298-.074.448-.093a.75.75 0 00-.087-1.493 8.25 8.25 0 00-2.883-.342 6.75 6.75 0 00-3.35 1.164.75.75 0 00-.317.07l-1.394.39a.75.75 0 00-.598.665c-.742 2.766-1.573 5.337-2.029 7.425a.75.75 0 00.598.908 1.125 1.125 0 01-.137.94c-1.065 1.066-1.897 2.296-2.502 3.659a.75.75 0 00.999.074 9.75 9.75 0 008.06-7.854c.243-.911.383-1.86.426-2.837a.75.75 0 00-.006-.239c0-.026-.002-.052-.006-.077a.75.75 0 00-.097-.282l-.082-.143a.75.75 0 00-.333-.217 2.25 2.25 0 01-2.434-2.434.75.75 0 00-.097-.333L7.5 11.25a.75.75 0 00-.097-.183 2.25 2.25 0 01-1.385-2.093c-.018-.118-.035-.238-.05-.357a.75.75 0 00-.92-.562c-.312.062-.622.128-.929.199a.75.75 0 00-.583.567A8.25 8.25 0 004.25 12a.75.75 0 00.007-.07c.306-1.282 1.047-2.383 1.96-3.235a.75.75 0 00.334-.736c-.03-.1-.06-.201-.09-.302a.75.75 0 00-.56-.911L4.85 6.75a.75.75 0 00-.598-.665A8.25 8.25 0 002.25 12c0 .026.002.052.006.077a.75.75 0 00.097.282l.082.143a.75.75 0 00.333.217 2.25 2.25 0 012.434 2.434.75.75 0 00.097.333L7.5 11.25z"
      clipRule="evenodd"
    />
  </svg>
);


// Edit User Modal Component
// This component handles the form for editing user details.
const EditUserModal = ({ userData, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || '',
    middleName: userData.middleName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    phoneNumber: userData.phoneNumber || '',
    role: userData.role || '',
    status: userData.status || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await api.put(`${BASE_URL}/users/${userData.id}`, formData);
      if (response.data.success) {
        toast.success('User details updated successfully!');
        onSaveSuccess(response.data.data); // Pass updated data back to parent
        onClose();
      } else {
        setError(response.data.message || 'Failed to update user.');
        toast.error(response.data.message || 'Failed to update user.');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      toast.error(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light"
          disabled={isSaving}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              type="text"
              id="middleName"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          {/* Role and Status are usually read-only or controlled by admin panel,
              but added here as per general edit request.
              Consider disabling or making read-only if not editable by user. */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
              readOnly // Often roles are not self-editable
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input
              type="text"
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
              readOnly // Often status is not self-editable
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [companyName, setCompanyName] = useState('Unknown Company'); // Default or N/A
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  // Removed: [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
    const storedCompanyName = localStorage.getItem('companyName');

    if (storedCompanyName) {
      setCompanyName(storedCompanyName);
    }

    if (!userId) {
      setError('User ID not found in local storage. Please log in.');
      setLoading(false);
      return;
    }

    try {
      // Use the 'api' instance from config/api to ensure cookies are sent
      const response = await api.get(`${BASE_URL}/users/${userId}`);
      if (response.data) {
        setUserData(response.data);
      } else {
        setError('User data not found.');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSaveSuccess = (updatedData) => {
    setUserData(updatedData); // Update local state with new data
    // Optionally, update localStorage if these fields are part of the cached 'user' object
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
        const updatedStoredUser = {
            ...storedUser,
            firstName: updatedData.firstName,
            lastName: updatedData.lastName,
            email: updatedData.email,
            phoneNumber: updatedData.phoneNumber,
            middleName: updatedData.middleName,
            role: updatedData.role, // Assuming role can be updated and needs to be in cache
            status: updatedData.status // Assuming status can be updated and needs to be in cache
        };
        localStorage.setItem('user', JSON.stringify(updatedStoredUser));
    }
    setShowEditModal(false);
  };

  const handleLogout = async () => {
    try {
      // Use the 'api' instance for authenticated logout
      await api.post(`${BASE_URL}/auth/logout`);
      toast.success('Logged out successfully!');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error(err.response?.data?.message || 'Logout failed. Please try again.');
    } finally {
      // Clear all relevant local storage items
      localStorage.removeItem('user');
      localStorage.removeItem('companyId');
      localStorage.removeItem('companyName');
      localStorage.removeItem('createdByUserId'); // If you use this

      // Redirect to the login page
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md shadow-md">
          <p className="font-medium text-xl mb-4">Error: {error}</p>
          <button
            onClick={fetchUserProfile}
            className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            Retry Loading Profile
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center text-gray-600 text-xl">No user data available.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-200"> {/* Adjusted padding and max-w */}
        <div className="text-center mb-6"> {/* Reduced margin-bottom */}
          <UserIcon />
          <h2 className="text-2xl font-extrabold text-gray-900 mt-3"> {/* Adjusted font size and margin-top */}
            {userData.firstName} {userData.middleName ? `${userData.middleName} ` : ''}{userData.lastName}
          </h2>
          <div className="flex items-center justify-center mt-2"> {/* Reduced margin-top */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-green-100 text-green-800"> {/* Adjusted padding */}
              <span className="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span> {/* Adjusted size and margin */}
              {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)} {/* Capitalize status */}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-gray-700 text-sm"> {/* Adjusted spacing and font size */}
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-100"> {/* Adjusted padding */}
            <span className="font-medium">Company:</span>
            <span>{companyName || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-100">
            <span className="font-medium">Email:</span>
            <span>{userData.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center pb-1.5 border-b border-gray-100">
            <span className="font-medium">Phone Number:</span>
            <span>{userData.phoneNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Role:</span>
            <span>{userData.role || 'N/A'}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"> {/* Adjusted margin-top and gap */}
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full sm:w-auto flex-1 px-4 py-2 text-base bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 font-semibold" /* Adjusted padding and font size */
          >
            Edit Profile
          </button>
          <button
            onClick={() => router.push('/auth/reset-password')}
            className="w-full sm:w-auto flex-1 px-4 py-2 text-base bg-yellow-600 text-white rounded-md shadow-md hover:bg-yellow-700 transition-colors duration-200 font-semibold" /* Adjusted padding and font size */
          >
            Reset Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto flex-1 px-4 py-2 text-base bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-200 font-semibold" /* Adjusted padding and font size */
          >
            Logout
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditUserModal
          userData={userData}
          onClose={() => setShowEditModal(false)}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}


// 'use client';

// import React, { useState, useEffect, useCallback } from 'react';
// import api, { BASE_URL } from '@/app/config/api'; // Adjust path as per your project structure
// import { useRouter } from 'next/navigation'; // For redirection
// import { toast } from 'react-hot-toast'; // For notifications

// // A simple default user icon (SVG)
// const UserIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     fill="currentColor"
//     className="w-24 h-24 text-gray-400 mx-auto"
//   >
//     <path
//       fillRule="evenodd"
//       d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.623 18.623 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.438-.695z"
//       clipRule="evenodd"
//     />
//   </svg>
// );

// // Eye icon for password toggle (open)
// const EyeOpenIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     fill="currentColor"
//     className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
//   >
//     <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
//     <path
//       fillRule="evenodd"
//       d="M1.323 11.447C2.811 6.976 7.027 3.75 12 3.75c4.973 0 9.189 3.226 10.677 7.697a1.125 1.125 0 010 .556c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-.556zM12 17.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z"
//       clipRule="evenodd"
//     />
//   </svg>
// );

// // Eye icon for password toggle (closed)
// const EyeClosedIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     viewBox="0 0 24 24"
//     fill="currentColor"
//     className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
//   >
//     <path
//       d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.28 12.822a1.125 1.125 0 010 1.056c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-1.056c.94-2.825 2.617-5.241 4.673-7.147a.75.75 0 00.1-.912l.145-.163a.75.75 0 00.007-.959 2.25 2.25 0 013.118-2.45c.189.04.375.085.558.134a.75.75 0 00.203-.006l.305-.082c.15-.04.298-.074.448-.093a.75.75 0 00-.087-1.493 8.25 8.25 0 00-2.883-.342 6.75 6.75 0 00-3.35 1.164.75.75 0 00-.317.07l-1.394.39a.75.75 0 00-.598.665c-.742 2.766-1.573 5.337-2.029 7.425a.75.75 0 00.598.908 1.125 1.125 0 01-.137.94c-1.065 1.066-1.897 2.296-2.502 3.659a.75.75 0 00.999.074 9.75 9.75 0 008.06-7.854c.243-.911.383-1.86.426-2.837a.75.75 0 00-.006-.239c0-.026-.002-.052-.006-.077a.75.75 0 00-.097-.282l-.082-.143a.75.75 0 00-.333-.217 2.25 2.25 0 01-2.434-2.434.75.75 0 00-.097-.333L7.5 11.25a.75.75 0 00-.097-.183 2.25 2.25 0 01-1.385-2.093c-.018-.118-.035-.238-.05-.357a.75.75 0 00-.92-.562c-.312.062-.622.128-.929.199a.75.75 0 00-.583.567A8.25 8.25 0 004.25 12a.75.75 0 00.007-.07c.306-1.282 1.047-2.383 1.96-3.235a.75.75 0 00.334-.736c-.03-.1-.06-.201-.09-.302a.75.75 0 00-.56-.911L4.85 6.75a.75.75 0 00-.598-.665A8.25 8.25 0 002.25 12c0 .026.002.052.006.077a.75.75 0 00.097.282l.082.143a.75.75 0 00.333.217 2.25 2.25 0 012.434 2.434.75.75 0 00.097.333L7.5 11.25z"
//       clipRule="evenodd"
//     />
//   </svg>
// );


// // Edit User Modal Component
// // This component handles the form for editing user details.
// const EditUserModal = ({ userData, onClose, onSaveSuccess }) => {
//   const [formData, setFormData] = useState({
//     firstName: userData.firstName || '',
//     middleName: userData.middleName || '',
//     lastName: userData.lastName || '',
//     email: userData.email || '',
//     phoneNumber: userData.phoneNumber || '',
//     role: userData.role || '',
//     status: userData.status || ''
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSaving(true);
//     setError(null);

//     try {
//       const response = await api.put(`${BASE_URL}/users/${userData.id}`, formData);
//       if (response.data.success) {
//         toast.success('User details updated successfully!');
//         onSaveSuccess(response.data.data); // Pass updated data back to parent
//         onClose();
//       } else {
//         setError(response.data.message || 'Failed to update user.');
//         toast.error(response.data.message || 'Failed to update user.');
//       }
//     } catch (err) {
//       console.error('Error updating user:', err);
//       setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
//       toast.error(err.response?.data?.message || 'Failed to update user.');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
//         <button
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-light"
//           disabled={isSaving}
//         >
//           &times;
//         </button>
//         <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Profile</h2>

//         {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

//         <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
//           <div>
//             <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
//             <input
//               type="text"
//               id="firstName"
//               name="firstName"
//               value={formData.firstName}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
//             <input
//               type="text"
//               id="middleName"
//               name="middleName"
//               value={formData.middleName}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             />
//           </div>
//           <div>
//             <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
//             <input
//               type="text"
//               id="lastName"
//               name="lastName"
//               value={formData.lastName}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//               required
//             />
//           </div>
//           <div>
//             <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
//             <input
//               type="text"
//               id="phoneNumber"
//               name="phoneNumber"
//               value={formData.phoneNumber}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
//             />
//           </div>
//           {/* Role and Status are usually read-only or controlled by admin panel,
//               but added here as per general edit request.
//               Consider disabling or making read-only if not editable by user. */}
//           <div>
//             <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
//             <input
//               type="text"
//               id="role"
//               name="role"
//               value={formData.role}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
//               readOnly // Often roles are not self-editable
//             />
//           </div>
//           <div>
//             <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <input
//               type="text"
//               id="status"
//               name="status"
//               value={formData.status}
//               onChange={handleChange}
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 cursor-not-allowed sm:text-sm"
//               readOnly // Often status is not self-editable
//             />
//           </div>

//           <div className="flex justify-end gap-3 mt-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
//               disabled={isSaving}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               disabled={isSaving}
//             >
//               {isSaving ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };


// export default function UserProfile() {
//   const [userData, setUserData] = useState(null);
//   const [companyName, setCompanyName] = useState('Unknown Company'); // Default or N/A
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   // Removed: [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
//   const router = useRouter();

//   const fetchUserProfile = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
//     const storedCompanyName = localStorage.getItem('companyName');

//     if (storedCompanyName) {
//       setCompanyName(storedCompanyName);
//     }

//     if (!userId) {
//       setError('User ID not found in local storage. Please log in.');
//       setLoading(false);
//       return;
//     }

//     try {
//       // Use the 'api' instance from config/api to ensure cookies are sent
//       const response = await api.get(`${BASE_URL}/users/${userId}`);
//       if (response.data) {
//         setUserData(response.data);
//       } else {
//         setError('User data not found.');
//       }
//     } catch (err) {
//       console.error('Error fetching user profile:', err);
//       setError(err.response?.data?.message || err.message || 'Failed to load user profile.');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchUserProfile();
//   }, [fetchUserProfile]);

//   const handleSaveSuccess = (updatedData) => {
//     setUserData(updatedData); // Update local state with new data
//     // Optionally, update localStorage if these fields are part of the cached 'user' object
//     const storedUser = JSON.parse(localStorage.getItem('user'));
//     if (storedUser) {
//         const updatedStoredUser = {
//             ...storedUser,
//             firstName: updatedData.firstName,
//             lastName: updatedData.lastName,
//             email: updatedData.email,
//             phoneNumber: updatedData.phoneNumber,
//             middleName: updatedData.middleName,
//             role: updatedData.role, // Assuming role can be updated and needs to be in cache
//             status: updatedData.status // Assuming status can be updated and needs to be in cache
//         };
//         localStorage.setItem('user', JSON.stringify(updatedStoredUser));
//     }
//     setShowEditModal(false);
//   };

//   const handleLogout = async () => {
//     try {
//       // Use the 'api' instance for authenticated logout
//       await api.post(`${BASE_URL}/auth/logout`);
//       toast.success('Logged out successfully!');
//     } catch (err) {
//       console.error('Logout error:', err);
//       toast.error(err.response?.data?.message || 'Logout failed. Please try again.');
//     } finally {
//       // Clear all relevant local storage items
//       localStorage.removeItem('user');
//       localStorage.removeItem('companyId');
//       localStorage.removeItem('companyName');
//       localStorage.removeItem('createdByUserId'); // If you use this

//       // Redirect to the login page
//       router.push('/auth/login');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-100">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
//         <p className="ml-4 text-lg text-gray-700">Loading user profile...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-100">
//         <div className="text-center bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md shadow-md">
//           <p className="font-medium text-xl mb-4">Error: {error}</p>
//           <button
//             onClick={fetchUserProfile}
//             className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
//           >
//             Retry Loading Profile
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!userData) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-100">
//         <div className="text-center text-gray-600 text-xl">No user data available.</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
//       <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg border border-gray-200">
//         <div className="text-center mb-8">
//           <UserIcon />
//           <h2 className="text-3xl font-extrabold text-gray-900 mt-4">
//             {userData.firstName} {userData.middleName ? `${userData.middleName} ` : ''}{userData.lastName}
//           </h2>
//           <div className="flex items-center justify-center mt-3">
//             <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
//               <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
//               {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)} {/* Capitalize status */}
//             </span>
//           </div>
//         </div>

//         <div className="space-y-4 text-gray-700">
//           <div className="flex justify-between items-center pb-2 border-b border-gray-100">
//             <span className="font-medium">Company:</span>
//             <span>{companyName || 'N/A'}</span>
//           </div>
//           <div className="flex justify-between items-center pb-2 border-b border-gray-100">
//             <span className="font-medium">Email:</span>
//             <span>{userData.email || 'N/A'}</span>
//           </div>
//           <div className="flex justify-between items-center pb-2 border-b border-gray-100">
//             <span className="font-medium">Phone Number:</span>
//             <span>{userData.phoneNumber || 'N/A'}</span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span className="font-medium">Role:</span>
//             <span>{userData.role || 'N/A'}</span>
//           </div>
//         </div>

//         <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
//           <button
//             onClick={() => setShowEditModal(true)}
//             className="w-full sm:w-auto flex-1 px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
//           >
//             Edit Profile
//           </button>
//           <button
//             onClick={() => router.push('/auth/reset-password')} // Navigates to the new Reset Password page
//             className="w-full sm:w-auto flex-1 px-6 py-3 bg-yellow-600 text-white rounded-md shadow-md hover:bg-yellow-700 transition-colors duration-200 font-semibold text-lg"
//           >
//             Reset Password
//           </button>
//           <button
//             onClick={handleLogout}
//             className="w-full sm:w-auto flex-1 px-6 py-3 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 transition-colors duration-200 font-semibold text-lg"
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {showEditModal && (
//         <EditUserModal
//           userData={userData}
//           onClose={() => setShowEditModal(false)}
//           onSaveSuccess={handleSaveSuccess}
//         />
//       )}
//       {/* Removed: ResetPasswordModal */}
//     </div>
//   );
// }



