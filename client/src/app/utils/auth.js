
import api from '../config/api';

// Check if user is authenticated by verifying with backend
export const checkAuthStatus = async () => {
  try {
    // Make a request to verify authentication with your backend
    const response = await api.get('/auth/verify'); // Your backend needs a /auth/verify endpoint
    return {
      isAuthenticated: response.data.isAuthenticated,
      user: response.data.user,
      company: response.data.company || null,
      tokenData: response.data.tokenData // Assuming backend verify returns this
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    // On error, assume not authenticated and clear local storage proactively
    localStorage.removeItem('userData');
    localStorage.removeItem('createdByUserId');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyId');
    return {
      isAuthenticated: false,
      user: null,
      company: null,
      tokenData: null
    };
  }
};

// Get user data from localStorage (non-sensitive data only)
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Check if user is authenticated (client-side check - primarily for quick UI updates)
export const isAuthenticated = () => {
  const userData = getUserData();
  return userData && userData.isAuthenticated;
};

// Logout function
export const logout = async () => {
  try {
    // Call backend logout endpoint to clear the cookie
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Clear local storage regardless of API call success
    localStorage.removeItem('userData');
    localStorage.removeItem('createdByUserId');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyId');

    // Redirect to login
    if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
    }
  }
};

// Get company information
export const getCompanyData = () => {
  return {
    name: localStorage.getItem('companyName'),
    id: localStorage.getItem('companyId')
  };
};

// Update user data in localStorage
export const updateUserData = (newData) => {
  const currentData = getUserData();
  if (currentData) {
    const updatedData = { ...currentData, ...newData };
    localStorage.setItem('userData', JSON.stringify(updatedData));
    return updatedData;
  }
  return null;
};

// Refresh authentication status and update localStorage
// This function acts as the single source of truth for auth status.
export const refreshAuthStatus = async () => {
  try {
    const authStatus = await checkAuthStatus(); // Calls the backend
    if (authStatus.isAuthenticated) {
      // Update localStorage with fresh data from backend
      const userData = {
        ...authStatus.user,
        isAuthenticated: true
      };
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('createdByUserId', authStatus.user.id);

      if (authStatus.company) {
        localStorage.setItem('companyName', authStatus.company.name);
        localStorage.setItem('companyId', authStatus.company.id.toString());
      } else {
          localStorage.removeItem('companyName');
          localStorage.removeItem('companyId');
      }

      return authStatus;
    } else {
      // Clear localStorage if not authenticated by backend
      localStorage.removeItem('userData');
      localStorage.removeItem('createdByUserId');
      localStorage.removeItem('companyName');
      localStorage.removeItem('companyId');
      return authStatus;
    }
  } catch (error) {
    console.error('Error refreshing auth status:', error);
    // Ensure localStorage is cleared even if checkAuthStatus throws an error
    localStorage.removeItem('userData');
    localStorage.removeItem('createdByUserId');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyId');
    return { isAuthenticated: false, user: null, company: null, tokenData: null };
  }
};


