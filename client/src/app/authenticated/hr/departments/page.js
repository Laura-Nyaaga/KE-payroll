'use client';

import { useState, useEffect } from 'react';
import EditDepartment from './editDepartment';
import AddDepartment from './addDepartment';  
// import AddDepartment from './AddDepartment'; // Ensure this path is correct
import api, { BASE_URL } from '../../../config/api';


export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false); 
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const fetchDepartments = async () => {
    setIsLoading(true); 
    setError(null); 

    try {
      const companyId = localStorage.getItem('companyId'); 

      if (!companyId) {
        throw new Error('Company ID not found in local storage. Please log in again.');
      }

      const response = await api.get(`/departments/companies/${companyId}`);

      console.log('Departments Data:', response.data);
      setDepartments(response.data); 
      setError(null); 
    } catch (error) {
      console.error('Error fetching departments:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch departments. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); 
    }
  };

  /**
   * Handles the addition of a new department.
   * Sends a POST request to the backend using the `api` (axios) instance.
   * @param {object} departmentData 
   */
 
const handleAddDepartment = async (departmentData) => {
  setIsLoading(true);
  setError(null);

  try {
    const companyId = localStorage.getItem('companyId');
    
    if (!companyId) {
      throw new Error('Company ID not found in local storage. Please log in again.');
    }

    const dataToSend = {
      ...departmentData,
      companyId: companyId
    };

    const response = await api.post(`${BASE_URL}/departments`, dataToSend);

    console.log('Department added:', response.data);
    fetchDepartments();
    setShowAddModal(false);
    setError(null);
  } catch (err) {
    console.error('Error adding department:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to add department. Please try again.';
    setError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};
  /**
   * Handles the update of an existing department.
   * Sends a PUT request to the backend using the `api` (axios) instance.
   * @param {string} departmentId - The ID of the department to update.
   * @param {object} updatedData - The updated data for the department.
   */
  const handleUpdateDepartment = async (departmentId, updatedData) => {
    setIsLoading(true); // Set loading state for the update operation
    setError(null); // Clear any previous errors

    try {
      const response = await api.put(`${BASE_URL}/departments/${departmentId}`, updatedData);

      console.log('Department updated:', response.data);
      fetchDepartments(); 
      setError(null);
      setEditingDepartment(null); 
    } catch (err) {
      console.error('Error updating department:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update department. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); 
    }
  };

  /**
   * Toggles the status (Active/Inactive) of a department.
   * Sends a PUT request to the backend using the `api` (axios) instance.
   * @param {object} department - The department object whose status is to be toggled.
   */
  const handleToggleStatus = async (department) => {
    setError(null); 

    try {
      const newStatus = department.status === 'Active' ? 'Inactive' : 'Active';

      console.log('Attempting to toggle status:', {
        departmentId: department.id,
        currentStatus: department.status,
        newStatus: newStatus
      });

      const updateData = { status: newStatus };

      console.log('Sending update with data:', updateData);

      const response = await api.put(`${BASE_URL}/departments/${department.id}`, updateData);

      console.log('Status update response:', response.data);

      setDepartments(prevDepartments =>
        prevDepartments.map(d => (d.id === department.id ? { ...d, status: newStatus } : d))
      );

      if (editingDepartment && editingDepartment.id === department.id) {
        setEditingDepartment(prev => ({ ...prev, status: newStatus }));
      }

      setError(null); 
    } catch (err) {
      console.error('Error updating department status:', err);

      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }

      let errorMessage = 'Failed to update department status. Please try again.';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to change the department status.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []); 
  
  if (isLoading && departments.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Departments...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-3">HR Settings</h1>

      {/* Error display section */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchDepartments}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Departments Management</h2>
        <div className="flex items-center gap-4">
          {/* Export Departments Button */}
          {/* <button
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-md hover:bg-blue-100"
            onClick={() => {
              // Implement bulk export functionality here
              console.log('Export departments functionality to be implemented');
              alert('Export functionality is not yet implemented.'); // Using alert for placeholder, replace with custom modal
            }}
            title="Export Departments"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="ml-2 font-medium">Export</span>
          </button> */}

          {/* Add Department Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center"
            onClick={() => setShowAddModal(true)}
            title="Add New Department"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Department
          </button>
        </div>
      </div>

      {/* Departments Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {departments.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-lg">
                  No departments found. Click "Add Department" to create one.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {department.departmentCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {department.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {department.description || <span className="text-gray-400 italic">No description provided</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      department.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {department.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingDepartment(department)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                      aria-label="Edit department"
                      title="Edit Department"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(department)}
                      className={`p-1 rounded-md transition-colors duration-200 ${
                        department.status === 'Active'
                          ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      aria-label={`Toggle status to ${department.status === 'Active' ? 'Inactive' : 'Active'}`}
                      title={`Toggle Status to ${department.status === 'Active' ? 'Inactive' : 'Active'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {department.status === 'Active' ? (
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        ) : (
                          <path d="M22 12A10 10 0 0 0 12 2v10h10"></path>
                        )}
                        <path d="M12 2v10h10"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Loading overlay when performing any action (e.g., update, add) */}
      {isLoading && departments.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-2xl flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 mr-4"></div>
            <p className="text-lg text-gray-800">Processing request...</p>
          </div>
        </div>
      )}

      {/* Add Department Modal Component */}
      {showAddModal && (
        <AddDepartment
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDepartment}
        />
      )}

      {/* Edit Department Modal Component */}
      {editingDepartment && (
        <EditDepartment
          department={editingDepartment}
          onClose={() => setEditingDepartment(null)}
          onUpdate={handleUpdateDepartment}
          onStatusChange={() => handleToggleStatus(editingDepartment)}
        />
      )}
    </div>
  );
}


