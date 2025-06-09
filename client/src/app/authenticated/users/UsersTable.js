'use client';

import Link from 'next/link';
import { useState } from 'react';
import api, { BASE_URL } from '../../config/api'; // Ensure correct import path for axios instance

/**
 * UserTable Component
 * Displays a sortable table of users and handles inline editing.
 * It interacts with the backend API to update user details.
 * @param {object[]} users - Array of user objects to display.
 * @param {function} setUsers - Function to update the users array in the parent component (for optimistic updates).
 * @param {function} setError - Function to set error messages in the parent component.
 * @param {function} fetchUsers - Function to re-fetch users from the parent component after an update.
 */
export default function UserTable({ users, setUsers, setError, fetchUsers, handleToggleStatus }) {
  const [sortField, setSortField] = useState('firstName'); // Default sort field
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingId, setEditingId] = useState(null); // ID of the user currently being edited
  const [editFormData, setEditFormData] = useState({}); // Form data for the user being edited

  /**
   * Sorts users based on the current sort field and direction.
   * @returns {object[]} The sorted array of users.
   */
  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField]?.toString().toLowerCase() || '';
    const bValue = b[sortField]?.toString().toLowerCase() || '';

    if (sortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  /**
   * Handles sorting when a table header is clicked.
   * Toggles sort direction if the same field is clicked, otherwise sets new field to ascending.
   * @param {string} field - The field name to sort by.
   */
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Renders a sort arrow icon next to the sorted column header.
   * @param {string} field - The field name to check for sorting.
   * @returns {JSX.Element|null} The SVG icon or null if not the sorted field.
   */
  const renderSortArrow = (field) => {
    if (sortField !== field) return null;

    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    );
  };

  /**
   * Sets the user to be edited and populates the edit form data.
   * @param {object} user - The user object to edit.
   */
  const handleEditClick = (user) => {
    setEditingId(user.id);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '', // Ensure middleName is not undefined for input
      email: user.email,
      phoneNumber: user.phoneNumber,
      // Note: Password should ideally not be pre-filled or sent back for security reasons.
      // If updating password, it should be a separate field and handled securely.
      role: user.role,
      status: user.status
    });
  };

  /**
   * Handles changes in the inline edit form fields.
   * @param {Event} e - The change event from the input/select element.
   */
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Saves the updated user data to the backend.
   * Uses the `api` (axios) instance for the PUT request to ensure cookies are sent.
   * @param {string} id - The ID of the user to save.
   */
  const handleSave = async (id) => {
    setError(null); // Clear any previous errors
    try {
      const response = await api.put(`${BASE_URL}/users/${id}`, editFormData);
      const updatedUser = response.data;

      // Optimistic update: Update the user in the local state
      setUsers(users.map(user =>
        user.id === id ? updatedUser : user
      ));
      setEditingId(null); // Exit editing mode
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user. Please try again.';
      setError(errorMessage); // Set error in parent component
    }
  };

  /**
   * Returns Tailwind CSS classes for status badges based on the user status or role.
   * @param {string | undefined | null} value - The status or role string.
   * @param {boolean} isRole - True if the value is a role, false if it's a status.
   * @returns {string} Tailwind CSS classes for styling the badge.
   */
  const getBadgeColor = (value, isRole = false) => {
    const normalizedValue = (value || '').toLowerCase();

    if (isRole) {
      switch (normalizedValue) {
        case 'superadmin':
          return 'bg-blue-100 text-blue-800';
        case 'hradmin':
          return 'bg-purple-100 text-purple-800';
        case 'hr':
          return 'bg-indigo-100 text-indigo-800';
        case 'accountant':
          return 'bg-teal-100 text-teal-800';
        case 'manager':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else { // It's a status
      switch (normalizedValue) {
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-red-100 text-red-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };


  return (
    <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              NO
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('firstName')}
            >
              First Name {renderSortArrow('firstName')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('lastName')}
            >
              Last Name {renderSortArrow('lastName')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Phone Number
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('role')}
            >
              Role {renderSortArrow('role')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('status')}
            >
              Status {renderSortArrow('status')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sortedUsers.length === 0 ? (
            <tr key="no-users-found-row">
              <td colSpan="8" className="px-6 py-8 text-center text-gray-500 text-lg">
                No users found. Add a new user to get started.
              </td>
            </tr>
          ) : (
            sortedUsers.map((user, index) => (
              user && (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        name="firstName"
                        value={editFormData.firstName}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      />
                    ) : (
                      user.firstName
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        name="lastName"
                        value={editFormData.lastName}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      />
                    ) : (
                      user.lastName
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === user.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      />
                    ) : (
                      user.email || <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === user.id ? (
                      <input
                        type="text"
                        name="phoneNumber"
                        value={editFormData.phoneNumber}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      />
                    ) : (
                      user.phoneNumber || <span className="text-gray-400 italic">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === user.id ? (
                      <select
                        name="role"
                        value={editFormData.role}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      >
                        <option value="SuperAdmin">Super Admin</option>
                        <option value="HrAdmin">HR Admin</option>
                        <option value="Hr">HR</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Manager">Manager</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(user.role, true)}`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editingId === user.id ? (
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditChange}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(user.status)}`}>
                        {user.status || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === user.id ? (
                      <>
                        <button
                          onClick={() => handleSave(user.id)}
                          className="bg-green-500 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-md shadow-sm transition-colors duration-200 mr-2"
                          title="Save Changes"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-3 py-1 rounded-md shadow-sm transition-colors duration-200"
                          title="Cancel Editing"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                          aria-label="Edit user"
                          title="Edit User"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                       { /* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1 rounded-md transition-colors duration-200 ${
                            user.status === 'Active'
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          aria-label={`Toggle status to ${user.status === 'Active' ? 'Inactive' : 'Active'}`}
                          title={`Toggle Status to ${user.status === 'Active' ? 'Inactive' : 'Active'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {user.status === 'Active' ? (
                              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            ) : (
                              <path d="M22 12A10 10 0 0 0 12 2v10h10"></path>
                            )}
                            <path d="M12 2v10h10"></path>
                          </svg>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}