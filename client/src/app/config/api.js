import axios from "axios";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const API_TIMEOUT = 30000;

export const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/companies/register',
  PAYSLIPS: '/payroll/payslips',
  // Add verify endpoint
  VERIFY: '/auth/verify',
  LOGOUT: '/auth/logout'
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Sends cookies automatically - CORRECT!
});

// Response interceptor (keeps error handling)
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response?.status === 401) {
      // On 401 Unauthorized, clear user data and redirect
      // This is now redundant if you rely heavily on refreshAuthStatus,
      // but good as a fallback. The refreshAuthStatus will handle clearing localStorage.
      localStorage.removeItem('userData');
      localStorage.removeItem('companyName');
      localStorage.removeItem('companyId');
      localStorage.removeItem('createdByUserId'); // Ensure this is also cleared

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    // if (error.response?.status === 403) {
    //   console.error('Access forbidden:', error.response.data);
    //   // For 403, you might want to show a message or redirect to an access denied page
    //   // rather than always logging out, as 403 means "forbidden" (authenticated but not authorized)
    //   // whereas 401 means "unauthorized" (not authenticated).
    // }

    return Promise.reject(error);
  }
);

export default api; // Changed from API to api (lowercase) for consistency

