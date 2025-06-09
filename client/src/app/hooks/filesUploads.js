// hooks/useFileUpload.js
import { useState } from 'react';
import employeeApi from '../services/employeeApi';

/**
 * Custom hook to handle file uploads within form components
 */
const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [fileUrls, setFileUrls] = useState({});

  /**
   * Handle file upload for a form field
   * @param {File} file - The file to upload
   * @param {string} fieldName - The field name (e.g., 'passportPhoto')
   * @param {Function} onSuccess - Optional callback when upload succeeds
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  const uploadFile = async (file, fieldName, onSuccess) => {
    if (!file) {
      setUploadError('No file selected');
      return null;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);


// import axios from "axios";

// export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.84:4000/api';
// export const API_TIMEOUT = 30000;

// export const ENDPOINTS = {
//   LOGIN: '/auth/login',
//   REGISTER: '/companies/register',
//   PAYSLIPS: '/payroll/payslips',
// };

// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: API_TIMEOUT,
//   headers: { 'Content-Type': 'application/json' },
//   withCredentials: true, // Sends cookies automatically
// });

// // ----------------------------
// // Remove the TOKEN interceptor (not needed for cookies)
// // ----------------------------

// // Response interceptor (keeps error handling)
// api.interceptors.response.use(
//   (response) => response, // Pass through successful responses
//   (error) => {
//     if (error.response?.status === 401) {
//       // Clear user data on 401 Unauthorized
//       localStorage.removeItem('userData');
//       // localStorage.removeItem('createdByUserId');
//       localStorage.removeItem('companyName');
//       localStorage.removeItem('companyId');

//       // Redirect to login
//       if (typeof window !== 'undefined') {
//         window.location.href = '/auth/login';
//       }
//     }

//     // if (error.response?.status === 403) {
//     //   console.error('Access forbidden:', error.response.data);
//     // }

//     return Promise.reject(error);
//   }
// );

// export default api; // Fixed typo (was `export default API`)


// import axios from "axios";

// export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.84:4000/api';
// // export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.245.210:4000/api';


// export const API_TIMEOUT = 30000;

// // API endpoints
// export const ENDPOINTS = {
//   // Auth
//   LOGIN: '/auth/login',
//   REGISTER: '/companies/register',
  
//   // Payroll
//   PAYSLIPS: '/payroll/payslips',
  
// };

// const api = axios.create({
//   baseURL: BASE_URL,
//   timeout: API_TIMEOUT,
//   headers: { 'Content-Type': 'application/json' },
//   withCredentials: true 
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken');
//     if (token) {
//       config.headers['Authorization'] = `Bearer ${token}`;
//     }
//     console.log("Request headers", config.headers);   
//   return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.response && error.response.status === 401) {
// // clear local storage
//       localStorage.removeItem('userData');
//       localStorage.removeItem('createdByUserId');
//       localStorage.removeItem('companyName');
//       localStorage.removeItem('companyId');

//       console.error("Unauthorized access - redirecting to login");
//       // Optionally, you can redirect to login page here
//       // window.location.href = '/login';
//        // Redirect to login page
//        if (typeof window !== 'undefined') {
//         window.location.href = '/auth/login';
//       }
//     }

//     if (error.response && error.response.status === 403) {
//       console.error('Access forbidden:', error.response.data);
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;

      // Create a custom axios instance to track upload progress
      const uploadInstance = axios.create({
        baseURL: API_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', fieldName);

      const response = await uploadInstance.post('/uploads/employee-documents', formData);
      
      // Update the file URLs state
      setFileUrls(prev => ({
        ...prev,
        [fieldName]: response.data.fileUrl
      }));

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data.fileUrl);
      }

      return response.data.fileUrl;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'File upload failed';
      setUploadError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Create a file input handler for react-hook-form
   * @param {Function} setValue - The setValue function from useForm
   * @param {string} fieldName - Form field name
   * @returns {Function} - onChange handler
   */
  const createFileInputHandler = (setValue, fieldName) => {
    return async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        // Upload the file
        const fileUrl = await uploadFile(file, fieldName);
        
        // Set the URL in the form
        setValue(fieldName, fileUrl);
      } catch (error) {
        console.error('File upload error:', error);
      }
    };
  };

  return {
    uploading,
    uploadProgress,
    uploadError,
    fileUrls,
    uploadFile,
    createFileInputHandler
  };
};

export default useFileUpload;