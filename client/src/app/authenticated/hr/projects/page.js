'use client';

import { useState, useEffect } from 'react';
import AddProject from './addProject'; // Assuming this path is correct
import ProjectTable from './projectsTable'; // Assuming this path is correct
import api, { BASE_URL } from '../../../config/api'; // Ensure this path is correct for your axios instance

/**
 * ProjectsPage Component
 * Manages the display, addition, and export of projects.
 * It interacts with the backend API to perform CRUD operations, ensuring cookies are sent.
 */
export default function ProjectsPage() {
  // State variables for managing project data and UI states
  const [showAddModal, setShowAddModal] = useState(false); // Controls visibility of the Add Project modal
  const [projects, setProjects] = useState([]); // Stores the list of projects
  const [isLoading, setIsLoading] = useState(true); // Indicates if data is currently being loaded or processed
  const [error, setError] = useState(null); // Stores any error messages for display

  /**
   * Fetches the list of projects from the backend API.
   * It uses the `api` (axios) instance to ensure cookies are sent.
   */
  const fetchProjects = async () => {
    setIsLoading(true); // Set loading state to true before fetching
    setError(null); // Clear any previous errors

    try {
      const companyId = localStorage.getItem('companyId'); // Get companyId from local storage

      // Ensure companyId exists before making the request
      if (!companyId) {
        throw new Error('Company ID not found in local storage. Please log in again.');
      }

      // Use the 'api' (axios) instance for GET request to fetch projects
      // Axios automatically appends baseURL and handles JSON parsing.
      // 'credentials: include' is not needed with axios if 'withCredentials: true' is set on the instance.
      const response = await api.get(`/projects/companies/${companyId}`);

      console.log('Projects Data:', response.data);
      setProjects(response.data); // Axios response.data contains the parsed JSON
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Extract a user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch projects. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false); // Always set loading state to false after fetch attempt
    }
  };

  /**
   * Handles the addition of a new project.
   * Sends a POST request to the backend using the `api` (axios) instance.
   * @param {object} projectData - The data for the new project.
   */
  const handleAddProject = async (projectData) => {
    setError(null); // Clear any previous errors
    // setIsLoading(true); // Optionally set loading state for this specific action if needed

    const companyId = localStorage.getItem('companyId'); // Retrieve companyId from local storage

    // Prepare the request payload, including companyId.
    // Note: companyId is parsed to Int as per your original code's requestData.
    const requestData = {
      ...projectData,
      companyId: parseInt(companyId),
    };

    try {
      // Use the 'api' (axios) instance for POST request to create a project
      // Axios handles headers ('Content-Type': 'application/json') and body stringification automatically.
      const response = await api.post(`${BASE_URL}/projects`, requestData);

      console.log('Project created:', response.data);
      // Update projects state with the new project
      setProjects(prevProjects => [...prevProjects, response.data]);
      setShowAddModal(false); // Close the add project modal
      setError(null); // Clear error on success
    } catch (error) {
      console.error('Error creating project:', error);
      // Extract a user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create project. Please try again.';
      setError(errorMessage);
      // Replaced alert with setError for consistent error display
      // alert(errorMessage);
    } finally {
      // setIsLoading(false); // Optionally set loading state to false
    }
  };

  /**
   * Handles the export of project data.
   * Sends a GET request to the backend for a CSV export.
   */
  const handleExportData = async () => {
    setError(null); // Clear any previous errors
    setIsLoading(true); // Indicate loading for export operation

    try {
      // Use the 'api' (axios) instance for GET request to export data
      // Axios responseType 'blob' is crucial for file downloads
      const response = await api.get(`${BASE_URL}/projects/export`, {
        responseType: 'blob', // Important for downloading files
      });

      // Create a URL for the blob and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from Content-Disposition header if available, otherwise use a default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'projects_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url); // Clean up the URL object
      document.body.removeChild(a); // Remove the temporary anchor tag

      setError(null); // Clear error on successful export
    } catch (err) {
      console.error('Error exporting projects:', err);
      // Extract a user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export projects. Please try again.';
      setError(errorMessage);
      // Replaced alert with setError for consistent error display
      // alert(errorMessage);
    } finally {
      setIsLoading(false); // Always set loading state to false
    }
  };

  // Effect hook to fetch projects when the component mounts
  useEffect(() => {
    fetchProjects();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="p-6 bg-gray-50 min-h-screen rounded-lg shadow-md">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-3">HR Settings</h1>

      {/* Error display section */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-800 border border-red-300 rounded-md shadow-sm flex items-center justify-between">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchProjects}
            className="ml-4 bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300 transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">Projects Management</h2>
        <div className="flex items-center gap-4">
          {/* Export Projects Button */}
          {/* <button
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-md hover:bg-blue-100"
            onClick={handleExportData}
            disabled={isLoading || projects.length === 0} // Disable if loading or no projects to export
            title="Export Projects"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span className="ml-2 font-medium">Export</span>
          </button> */}

          {/* Add Project Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-md shadow-md transition-colors duration-200 flex items-center"
            onClick={() => setShowAddModal(true)}
            disabled={isLoading} // Disable if loading
            title="Add New Project"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Project
          </button>
        </div>
      </div>

      {/* Loading state for initial data fetch */}
      {isLoading && projects.length === 0 ? (
        <div className="flex justify-center items-center h-full min-h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Loading Projects...</p>
        </div>
      ) : (
        // Render ProjectTable only if not loading and no error
        <ProjectTable
          projects={projects}
          setProjects={setProjects} // Pass setProjects if ProjectTable needs to modify the list directly
          setError = {setError} // Pass setError to handle errors in ProjectTable
        />
      )}

      {/* Loading overlay when performing any action (e.g., add, export) */}
      {isLoading && projects.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-2xl flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-600 mr-4"></div>
            <p className="text-lg text-gray-800">Processing request...</p>
          </div>
        </div>
      )}

      {/* Add Project Modal Component */}
      {showAddModal && (
        <AddProject
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProject}
        />
      )}
    </div>
  );
}




