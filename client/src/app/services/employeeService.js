// services/employeeApi.js
import axios from 'axios';

// Set base URL from environment variable or default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or cookies depending on your auth setup
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// File upload client (for handling multipart/form-data)
const fileUploadClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

fileUploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Employee API service
const employeeApi = {
  // Create a new employee with all form data
  createEmployee: async (employeeData) => {
    try {
      // Check if there are file fields that need multipart/form-data
      const hasFiles = 
        (employeeData.passportPhoto instanceof File) || 
        (employeeData.certificatePhoto instanceof File);

      if (hasFiles) {
        // Convert to FormData for file uploads
        const formData = new FormData();
        
        // Add all fields to FormData
        Object.keys(employeeData).forEach(key => {
          if (employeeData[key] !== undefined && employeeData[key] !== null) {
            if (employeeData[key] instanceof File) {
              // Add file directly
              formData.append(key, employeeData[key]);
            } else if (typeof employeeData[key] === 'object' && !(employeeData[key] instanceof Date)) {
              // Convert objects to JSON strings
              formData.append(key, JSON.stringify(employeeData[key]));
            } else {
              // Add primitive values as is
              formData.append(key, employeeData[key]);
            }
          }
        });
        
        // Use file upload client for multipart/form-data
        const response = await fileUploadClient.post('/employees', formData);
        return response.data;
      } else {
        // Use regular JSON API client
        const response = await apiClient.post('/employees', employeeData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },
  
  // Upload employee documents (passport photo, certificates, etc.)
  uploadEmployeeDocument: async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await fileUploadClient.post('/uploads/employee-documents', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'File upload failed' };
    }
  },
  
  // Get reference data for dropdowns
  getJobTitles: async () => {
    try {
      const response = await apiClient.get('/job-titles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch job titles' };
    }
  },
  
  getDepartments: async () => {
    try {
      const response = await apiClient.get('/departments');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch departments' };
    }
  },
  
  getProjects: async () => {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch projects' };
    }
  },
  
  // Get employee by ID
  getEmployeeById: async (id) => {
    try {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch employee' };
    }
  },
  
  // Update employee
  updateEmployee: async (id, employeeData) => {
    try {
      const response = await apiClient.put(`/employees/${id}`, employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update employee' };
    }
  }
};

export default employeeApi;