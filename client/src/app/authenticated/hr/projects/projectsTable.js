'use client';

import Link from 'next/link';
import { useState } from 'react';
import api, { BASE_URL } from '../../../config/api'; // Ensure this path is correct for your axios instance

/**
 * ProjectTable Component
 * Displays a sortable table of projects and handles inline editing.
 * It interacts with the backend API to update project details.
 * @param {object[]} projects - Array of project objects to display.
 * @param {function} setProjects - Function to update the projects array in the parent component.
 * @param {function} setError - Function to set error messages in the parent component.
 */
export default function ProjectTable({ projects, setProjects, setError }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingId, setEditingId] = useState(null); // ID of the project currently being edited
  const [editFormData, setEditFormData] = useState({}); // Form data for the project being edited

  /**
   * Sorts projects based on the current sort field and direction.
   * @returns {object[]} The sorted array of projects.
   */
  const sortedProjects = [...projects].sort((a, b) => {
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
   * Sets the project to be edited and populates the edit form data.
   * @param {object} project - The project object to edit.
   */
  const handleEditClick = (project) => {
    setEditingId(project.id);
    setEditFormData({
      name: project.name,
      projectCode: project.projectCode,
      description: project.description,
      // Ensure date format is compatible with input type="date"
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      status: project.status
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
   * Saves the updated project data to the backend.
   * Uses the `api` (axios) instance for the PUT request to ensure cookies are sent.
   * @param {string} id - The ID of the project to save.
   */
  const handleSave = async (id) => {
    setError(null); // Clear any previous errors
    try {
      // Use the 'api' (axios) instance for PUT request
      // Axios automatically handles headers ('Content-Type': 'application/json') and body stringification.
      const response = await api.put(`${BASE_URL}/projects/${id}`, editFormData);

      const updatedProject = response.data; // Axios response.data contains the parsed JSON
      setProjects(projects.map(project =>
        project.id === id ? updatedProject : project
      ));
      setEditingId(null); // Exit editing mode
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error updating project:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update project. Please try again.';
      setError(errorMessage); // Set error in parent component
    }
  };

  /**
   * Returns Tailwind CSS classes for status badges based on the project status.
   * @param {string} status - The status of the project.
   * @returns {string} Tailwind CSS classes for styling the status badge.
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) { // Use optional chaining for safety
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('projectCode')}
            >
              Code {renderSortArrow('projectCode')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('name')}
            >
              Name {renderSortArrow('name')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Description
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('startDate')}
            >
              Start Date {renderSortArrow('startDate')}
            </th>
             <th
              className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('endDate')}
            >
              End Date {renderSortArrow('endDate')}
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
          {sortedProjects.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-lg">
                No projects found. Add a new project to get started.
              </td>
            </tr>
          ) : (
            sortedProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {project.projectCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === project.id ? (
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                    />
                  ) : (
                    project.name
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {editingId === project.id ? (
                    <textarea
                      name="description"
                      value={editFormData.description}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                      rows="2"
                    />
                  ) : (
                    project.description || <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === project.id ? (
                    <input
                      type="date"
                      name="startDate"
                      value={editFormData.startDate}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                    />
                  ) : (
                    // Format date for display
                    project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'
                  )}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {editingId === project.id ? (
                    <input
                      type="date"
                      name="endDate"
                      value={editFormData.endDate}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                    />
                  ) : (
                    // Format date for display
                    project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === project.id ? (
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditChange}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Completed">Completed</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingId === project.id ? (
                    <>
                      <button
                        onClick={() => handleSave(project.id)}
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
                        onClick={() => handleEditClick(project)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                        aria-label="Edit project"
                        title="Edit Project"
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
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}









