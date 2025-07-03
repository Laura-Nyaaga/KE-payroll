// utils/roleUtils.js

import React, { useState, useEffect } from 'react'; 
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify'; 

// Define role permissions for different features
export const PERMISSIONS = {
  PAYROLL: ['SuperAdmin', 'HrAdmin', 'Accountant'],
  HR_MANAGEMENT: ['SuperAdmin', 'HrAdmin', 'Hr'],
  USER_MANAGEMENT: ['SuperAdmin'],
  REPORTS: ['SuperAdmin', 'HrAdmin', 'Accountant', 'Manager'],
  EMPLOYEE_VIEW: ['SuperAdmin', 'HrAdmin', 'Hr', 'Manager'],
};

/**
 * Check if user has permission for a specific feature
 * @param {string} userRole - The user's role
 * @param {string} feature - The feature to check (key from PERMISSIONS)
 * @returns {boolean} - Whether user has permission
 */
export const hasPermission = (userRole, feature) => {
  if (!userRole || !feature || !PERMISSIONS[feature]) {
    return false;
  }
  return PERMISSIONS[feature].includes(userRole);
};

/**
 * Get user from localStorage safely
 * @returns {object|null} - User object or null if not found/invalid
 */
export const getCurrentUser = () => {
  try {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    return user.isAuthenticated ? user : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Check if current user has permission for a feature
 * @param {string} feature - The feature to check
 * @returns {boolean} - Whether current user has permission
 */
export const currentUserHasPermission = (feature) => {
  const user = getCurrentUser();
  if (!user) return false;
  return hasPermission(user.role, feature);
};

/**
 * Higher-order component for role-based access control
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {string} requiredFeature - Required feature permission
 * @param {string} redirectPath - Path to redirect if no permission (default: '/dashboard')
 * @returns {React.Component} - Protected component
 */
export const withRoleProtection = (WrappedComponent, requiredFeature, redirectPath = '/dashboard') => {
  return function ProtectedComponent(props) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const checkAccess = () => {
        const currentUser = getCurrentUser();
        
        if (!currentUser) {
          toast.error('Please log in to access this page');
          router.push('/login');
          return;
        }

        setUser(currentUser);
        const access = hasPermission(currentUser.role, requiredFeature);
        setHasAccess(access);
        
        if (!access) {
          toast.error('You do not have permission to access this feature');
          router.push(redirectPath);
          return;
        }
        
        setLoading(false);
      };

      checkAccess();
    }, [router]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-full min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Verifying permissions...</p>
        </div>
      );
    }

    if (!hasAccess) {
      return <UnauthorizedAccess />;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};

/**
 * React hook for role-based access control
 * @param {string} requiredFeature - Required feature permission
 * @param {string} redirectPath - Path to redirect if no permission
 * @returns {object} - { user, loading, hasAccess }
 */
export const useRoleAccess = (requiredFeature, redirectPath = '/dashboard') => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = () => {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        toast.error('Please log in to access this page');
        router.push('/login');
        return;
      }

      setUser(currentUser);
      const access = hasPermission(currentUser.role, requiredFeature);
      setHasAccess(access);
      
      if (!access) {
        toast.error('You do not have permission to access this feature');
        router.push(redirectPath);
        return;
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [requiredFeature, redirectPath, router]);

  return { user, loading, hasAccess };
};