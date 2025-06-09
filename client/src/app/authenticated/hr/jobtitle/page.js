'use client';

import { useState, useEffect } from 'react';
import AddJobTitle from './AddJobTitle'; // Assuming this path is correct
import EditJobTitle from './EditJobTitle'; // Assuming this path is correct
import { useRouter } from 'next/navigation'; // Keep if used elsewhere, otherwise can be removed
import api, { BASE_URL } from '../../../config/api'; // Ensure this path is correct for your axios instance

/**
 * JobTitlePage Component
 * Manages the display, addition, editing, and status toggling of job titles.
 * It interacts with the backend API to perform CRUD operations, ensuring cookies are sent.
 */
export default function JobTitlePage() {
  // State variables for managing job title data and UI states
  const [jobTitles, setJobTitles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false); // Controls visibility of the Add Job Title modal
  const [editingJob, setEditingJob] = useState(null); // Stores the job title being edited
  const [isLoading, setIsLoading] = useState(true); // Indicates if data is currently being loaded or processed
  const [error, setError] = useState(null); // Stores any error messages for display

  const router = useRouter();

  /**
   * Fetches the list of job titles from the backend API.
   * It uses the `api` (axios) instance to ensure cookies are sent.
   */
  const fetchJobTitles = async () => {
    setIsLoading(true); // Set loading state to true before fetching
    setError(null); // Clear any previous errors

    try {
      const companyId = localStorage.getItem('companyId'); // Get companyId from local storage

      // Ensure companyId exists before making the request
      if (!companyId) {
        throw new Error('Company ID not found in local storage. Please log in again.');
      }
      const response = await api.get(`/job-titles/companies/${companyId}`);

      console.log('Job Titles Data:', response.data);
      setJobTitles(response.data); // Axios response.data contains the parsed JSON
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error fetching job titles:', error);
      // Extract a user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch job titles. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Always set loading state to false after fetch attempt
    }
  };

  /**
   * Handles the addition of a new job title.
   * Sends a POST request to the backend using the `api` (axios) instance.
   * @param {object} jobTitleData - The data for the new job title (name, description).
   */
  const handleAddJob = async (jobTitleData) => {
    setError(null); // Clear any previous errors
    // setIsLoading(true); // Optionally set loading state for this specific action if needed

    const companyId = localStorage.getItem('companyId'); // Retrieve companyId from local storage

    // Prepare the request payload, including companyId
    const requestData = {
      ...jobTitleData,
      companyId: companyId,
    };

    try {
      // Use the 'api' (axios) instance for POST request to create a job title
      // Axios handles headers ('Content-Type': 'application/json') and body stringification automatically.
      const response = await api.post(`${BASE_URL}/job-titles`, requestData);

      console.log('Job title created:', response.data);
      fetchJobTitles(); // Refresh the list of job titles after successful creation
      setShowAddModal(false); // Close the add job title modal
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error creating job title:', error);
      // Extract a user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create job title. Please try again.';
      setError(errorMessage);
    } finally {
      // setIsLoading(false); // Optionally set loading state to false
    }
  };

  /**
   * Handles the update of an existing job title.
   * Sends a PUT request to the backend using the `api` (axios) instance.
   * @param {string} jobId - The ID of the job title to update.
   * @param {object} updatedData - The updated data for the job title.
   */
  const handleUpdateJob = async (jobId, updatedData) => {
    setIsLoading(true); // Set loading state for the update operation
    setError(null); // Clear any previous errors

    try {
      // Use the 'api' (axios) instance for PUT request to update job title
      // 'withCredentials: true' is not needed here as it's set on the axios instance.
      const response = await api.put(`${BASE_URL}/job-titles/${jobId}`, updatedData);

      console.log('Job title updated:', response.data);
      fetchJobTitles(); // Refresh job titles after successful update
      setError(null); // Clear error on success
      setEditingJob(null); // Close the edit modal
    } catch (err) {
      console.error('Error updating job title:', err);
      // Extract a user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update job title. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Always set loading state to false
    }
  };

  /**
   * Toggles the status (Active/Inactive) of a job title.
   * Sends a PUT request to the backend using the `api` (axios) instance.
   * @param {object} job - The job title object whose status is to be toggled.
   */
  const handleToggleStatus = async (job) => {
    setError(null); // Clear any previous errors
    // setIsLoading(true); // Optionally set loading state for this specific action

    try {
      const newStatus = job.status === 'Active' ? 'Inactive' : 'Active';

      console.log('Attempting to toggle status:', {
        jobId: job.id,
        currentStatus: job.status,
        newStatus: newStatus
      });

      const updateData = { status: newStatus };

      console.log('Sending update with data:', updateData);

      // Use the 'api' (axios) instance for PUT request to toggle status
      // 'withCredentials: true' is not needed here as it's set on the axios instance.
      const response = await api.put(`${BASE_URL}/job-titles/${job.id}`, updateData);

      console.log('Status update response:', response.data);

      // Optimistically update local state with the new status
      setJobTitles(prevTitles =>
        prevTitles.map(j => (j.id === job.id ? { ...j, status: newStatus } : j))
      );

      // If the job title being edited is the one whose status was toggled, update its state in the modal
      if (editingJob && editingJob.id === job.id) {
        setEditingJob(prev => ({ ...prev, status: newStatus }));
      }

      setError(null); // Clear error on success
    } catch (err) {
      console.error('Error updating job status:', err);

      // Log detailed error response if available
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }

      // Construct user-friendly error message based on status code or response data
      let errorMessage = 'Failed to update job status. Please try again.';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to change the job status.';
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

  // Effect hook to fetch job titles when the component mounts
  useEffect(() => {
    fetchJobTitles();
  }, []); // Empty dependency array means this runs once on mount

  // Render a loading spinner if data is being fetched for the first time
  if (isLoading && jobTitles.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-700">Loading Job Titles...</p>
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
            onClick={fetchJobTitles}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Job Titles Management</h2>
        <div className="flex items-center gap-4">
          {/* Export Job Titles Button */}
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-md hover:bg-blue-100"
            onClick={() => {
              // Implement bulk export functionality here
              console.log('Export job titles functionality to be implemented');
              alert('Export functionality is not yet implemented.'); 
            }}
            title="Export Job Titles"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="ml-2 font-medium">Export</span>
          </button>

          {/* Add Job Title Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center"
            onClick={() => setShowAddModal(true)}
            title="Add New Job Title"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Job Title
          </button>
        </div>
      </div>

      {/* Job Titles Table */}
      <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
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
            {jobTitles.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-lg">
                  No job titles found. Click "Add Job Title" to create one.
                </td>
              </tr>
            ) : (
              jobTitles.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {job.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {job.description || <span className="text-gray-400 italic">No description provided</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingJob(job)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 p-1 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                      aria-label="Edit job title"
                      title="Edit Job Title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className={`p-1 rounded-md transition-colors duration-200 ${
                        job.status === 'Active'
                          ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      aria-label={`Toggle status to ${job.status === 'Active' ? 'Inactive' : 'Active'}`}
                      title={`Toggle Status to ${job.status === 'Active' ? 'Inactive' : 'Active'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {job.status === 'Active' ? (
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
      {isLoading && jobTitles.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-2xl flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 mr-4"></div>
            <p className="text-lg text-gray-800">Processing request...</p>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddJobTitle
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddJob}
        />
      )}

      {/* Edit Job Title Modal Component */}
      {editingJob && (
        <EditJobTitle
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onUpdate={handleUpdateJob}
          onStatusChange={() => handleToggleStatus(editingJob)}
        />
      )}
    </div>
  );
}

