"use client";

import { useState, useEffect, useContext, createContext } from 'react';
import { checkAuthStatus, getUserData, logout as apiLogout, refreshAuthStatus } from '../utils/auth';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration status

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize auth state only after hydration
  useEffect(() => {
    if (isHydrated) {
      initializeAuth();
    }
  }, [isHydrated]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Attempt to refresh auth status with backend
      const authStatus = await refreshAuthStatus();

      if (authStatus.isAuthenticated) {
        // If authenticated by backend, update state and localStorage
        setUser(authStatus.user);
        setCompany(authStatus.company);
        setIsAuthenticated(true);
        setTokenData(authStatus.tokenData);
        
        // Update localStorage safely (only on client)
        if (typeof window !== 'undefined') {
          const userDataToStore = {
            id: authStatus.user.id,
            firstName: authStatus.user.firstName,
            lastName: authStatus.user.lastName,
            role: authStatus.user.role,
            email: authStatus.user.email,
            isAuthenticated: true
          };
          localStorage.setItem('user', JSON.stringify(userDataToStore));
          localStorage.setItem('createdByUserId', authStatus.user.id);

          if (authStatus.company) {
            localStorage.setItem('companyName', authStatus.company.name);
            localStorage.setItem('companyId', authStatus.company.id.toString());
          } else {
            localStorage.removeItem('companyName');
            localStorage.removeItem('companyId');
          }
        }
      } else {
        // If not authenticated by backend, clear all local storage and state
        setUser(null);
        setCompany(null);
        setIsAuthenticated(false);
        setTokenData(null);
        
        // Clear localStorage safely (only on client)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('createdByUserId');
          localStorage.removeItem('companyName');
          localStorage.removeItem('companyId');
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setCompany(null);
      setTokenData(null);
      
      // Clear localStorage safely (only on client)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('createdByUserId');
        localStorage.removeItem('companyName');
        localStorage.removeItem('companyId');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login function called by login component
  const login = (userData, companyData = null) => {
    setUser(userData);
    setCompany(companyData);
    setIsAuthenticated(true);

    // Update localStorage safely (only on client)
    if (typeof window !== 'undefined') {
      const userDataToStore = {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        email: userData.email,
        isAuthenticated: true
      };
      localStorage.setItem('user', JSON.stringify(userDataToStore));
      localStorage.setItem('createdByUserId', userData.id);

      if (companyData) {
        localStorage.setItem('companyName', companyData.name);
        localStorage.setItem('companyId', companyData.id.toString());
      } else {
        localStorage.removeItem('companyName');
        localStorage.removeItem('companyId');
      }
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage regardless of API call success
      setUser(null);
      setCompany(null);
      setIsAuthenticated(false);
      setTokenData(null);
      
      // Clear localStorage safely (only on client)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('createdByUserId');
        localStorage.removeItem('companyName');
        localStorage.removeItem('companyId');
      }
    }
  };

  // Refresh auth state (can be called manually if needed)
  const refresh = async () => {
    return await initializeAuth();
  };

  const value = {
    user,
    company,
    isAuthenticated,
    isLoading: isLoading || !isHydrated, // Keep loading until hydrated
    tokenData,
    login,
    logout: handleLogout,
    refresh,
    initializeAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = (WrappedComponent) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show unauthorized message
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};
