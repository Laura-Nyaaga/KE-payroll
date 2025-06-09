'use client';
import { useState, useEffect } from 'react';
import AddUser from './addUser';
import UserTable from './UsersTable';
import  api, { BASE_URL } from '@/app/config/api';


/**
 * UsersPage Component
 * Manages the display, addition, and export of users.
 * It interacts with the backend API to perform CRUD operations, ensuring cookies are sent.
 */
export default function UsersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // State for displaying errors
  const [searchQuery, setSearchQuery] = useState(''); // State for search input

  /**
   * Fetches the list of users from the backend API.
   * Uses the `api` (axios) instance to ensure cookies are sent.
   */
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const companyId = localStorage.getItem('companyId');

      if (!companyId) {
        throw new Error('Company ID not found in local storage. Please log in again.');
      }

      // Use api (axios) for fetching users
      const response = await api.get(`/users/company/${companyId}`);

      console.log('Users Data:', response.data);
      setUsers(response.data); // Axios gives data in response.data
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the addition of a new user.
   * Uses the `api` (axios) instance to send cookies.
   * @param {object} userData - The data for the new user.
   */
  const handleAddUser = async (userData) => {
    setError(null); // Clear any previous errors
    // setIsLoading(true); // Optionally show loading for this specific action

    const companyId = localStorage.getItem('companyId');
    const requestData = {
      ...userData,
      companyId: parseInt(companyId)
    };

    try {
      // Use api (axios) for adding user
      const response = await api.post(`${BASE_URL}/users/register`, requestData);

      console.log('User registered:', response.data);
      // Instead of manually updating state, re-fetch to ensure data consistency
      fetchUsers(); // Refresh the list to include the new user
      setShowAddModal(false); // Close the modal
      setError(null);
    } catch (error) {
      console.error('Error registering user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register user. Please try again.';
      setError(errorMessage); // Use setError instead of alert
    } finally {
      // setIsLoading(false);
    }
  };

  /**
   * Handles exporting user data.
   * Uses the `api` (axios) instance to send cookies.
   */
  const handleExportData = async () => {
    setError(null); // Clear any previous errors
    setIsLoading(true); // Indicate loading for export operation

    try {
      // Use api (axios) for exporting data, with responseType 'blob' for file download
      const response = await api.get(`${BASE_URL}/users/export`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'users_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setError(null);
    } catch (err) {
      console.error('Error exporting users:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export users. Please try again.';
      setError(errorMessage); // Use setError instead of alert
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles toggling the status (Active/Inactive) of a user.
   * Sends a PUT request to the backend using the `api` (axios) instance.
   * @param {object} user - The user object whose status is to be toggled.
   */
  const handleToggleStatus = async (user) => {
    setError(null); // Clear any previous errors
    // setIsLoading(true); // Optionally set loading state for this specific action

    try {
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

      console.log('Attempting to toggle status:', {
        userId: user.id,
        currentStatus: user.status,
        newStatus: newStatus
      });

      const updateData = { status: newStatus };

      console.log('Sending update with data:', updateData);

      // Use the 'api' (axios) instance for PUT request to toggle status
      const response = await api.put(`${BASE_URL}/users/${user.id}`, updateData);

      console.log('Status update response:', response.data);

      // Optimistically update local state with the new status
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === user.id ? { ...u, status: newStatus } : u))
      );

      setError(null); // Clear error on success
    } catch (err) {
      console.error('Error updating user status:', err);

      // Log detailed error response if available
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }

      let errorMessage = 'Failed to update user status';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to change the user status.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      // setIsLoading(false);
    }
  };


  // Filtered users based on search query
  const filteredUsers = users.filter(user =>
    // FIX: Add nullish coalescing operator to safely call toLowerCase()
    (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phoneNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Effect hook to fetch users when the component mounts
  useEffect(() => {
    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  // Render loading state for initial fetch
  if (isLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-3">Admin Settings</h1>

      {/* Error display section */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchUsers}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Users Management</h2>
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* Export Users Button */}
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-md hover:bg-blue-100"
            onClick={handleExportData}
            disabled={isLoading || users.length === 0}
            title="Export Users"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="ml-2 font-medium">Export</span>
          </button>

          {/* Add User Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center"
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
            title="Add New User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add User
          </button>
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="flex justify-center items-center h-full min-h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Loading Users...</p>
        </div>
      ) : (
        <UserTable
          users={filteredUsers} // Pass filtered users to UserTable
          setUsers={setUsers}
          setError={setError} // Pass setError to UserTable
          fetchUsers={fetchUsers} // Pass fetchUsers to UserTable for refreshing after edits
          handleToggleStatus={handleToggleStatus} // Pass handleToggleStatus to UserTable
        />
      )}

      {/* Loading overlay for other actions */}
      {isLoading && users.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-2xl flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 mr-4"></div>
            <p className="text-lg text-gray-800">Processing request...</p>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddUser
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser} // This will trigger handleAddUser in UsersPage
        />
      )}
    </div>
  );
}

