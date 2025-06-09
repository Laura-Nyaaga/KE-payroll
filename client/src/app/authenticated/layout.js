'use client';

import { useState, useEffect } from 'react';

// import { EmployeeFormProvider } from "../context/EmployeeFormContext";
import Sidebar from './Sidebar';

export default function AuthLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    role: '',
    companyName: '',
    initials: 'JD' // Default initials
  });

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);


  // Load user information
  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('userData');
    const companyName = localStorage.getItem('companyName');

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);

        // Set user information
        setUserInfo({
          firstName: parsedUserData.firstName || '',
          lastName: parsedUserData.lastName || '',
          role: parsedUserData.role || '',
          companyName: companyName || '',
          initials: getInitials(parsedUserData.firstName, parsedUserData.lastName, companyName)
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      // If no user data in localStorage but we have company name,
      // assume this is the super admin (company owner)
      if (companyName) {
        setUserInfo({
          firstName: '',
          lastName: '',
          role: 'Super Admin',
          companyName: companyName,
          initials: getInitials('', '', companyName)
        });
      }
    }
  }, []);

  // Function to generate initials
  const getInitials = (firstName, lastName, companyName) => {
    // If we have first and last name
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    // If only first name
    if (firstName && !lastName) {
      return firstName.substring(0, 2).toUpperCase();
    }

    // If we're using company name (super admin)
    if (companyName) {
      const words = companyName.split(' ');
      if (words.length === 1) {
        // If only one word, take first two letters
        return companyName.substring(0, 2).toUpperCase();
      } else {
        // Otherwise take first letter of first two words
        return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
      }
    }

    // Default fallback
    return 'JD';
  };

  // Get display name based on role
  const getDisplayName = () => {
    if (userInfo.role === 'Super Admin') {
      return `Super Admin-${userInfo.companyName}`;
    } else {
      // If we have both first and last name
      if (userInfo.firstName && userInfo.lastName) {
        return `${userInfo.firstName} ${userInfo.lastName}`;
      }
      // If we only have first name
      else if (userInfo.firstName) {
        return userInfo.firstName;
      }
      // Fallback
      else {
        return 'User';
      }
    }
  };

  // Function to toggle theme
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply theme to root HTML element for global CSS variables
    document.documentElement.setAttribute('data-theme', newTheme);

    // Apply theme class to body for broader CSS selector access
    if (newTheme === 'dark') {
      document.body.classList.toggle('dark-theme');
      document.body.classList.toggle('light-theme');
    } else {
      document.body.classList.toggle('light-theme');
      document.body.classList.toggle('dark-theme');
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      
       {/* <EmployeeFormProvider> */}
     
      {/* Sidebar - completely hidden when collapsed */}
      {!collapsed && (
        <div className="w-60 transition-all duration-300 ease-in-out flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        {/* Fixed Header */}
        <header className={`h-16 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b flex items-center justify-between px-4 shadow-sm z-10`}>
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

          </div>

          {/* Right side of header - User info/actions and Theme Switcher */}
          <div className="flex items-center gap-3 ml-4 flex-shrink-0">
            {/* Theme Selector */}
            <div className="flex items-center rounded-md overflow-hidden">
              <button
                onClick={() => toggleTheme('light')}
                className={`p-1 px-2 text-xs ${theme === 'light' ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
              >
                Light
              </button>
              <button
                onClick={() => toggleTheme('dark')}
                className={`p-1 px-2 text-xs ${theme === 'dark' ? 'bg-blue-500 text-white' : theme === 'light' ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-300'}`}
              >
                Dark
              </button>
            </div>

            <div className="relative flex-shrink-0">
              <button className={`relative p-1 rounded-full ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full ${userInfo.role === 'Super Admin' ? 'bg-purple-600' : 'bg-indigo-600'} flex items-center justify-center text-white font-medium flex-shrink-0`}>
                {userInfo.initials}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {getDisplayName()}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content with fixed height to prevent entire page scrolling */}
        <main className="flex-1 overflow-y-auto p-4" style={{ height: 'calc(100vh - 4rem)' }}>
          {children}
        </main>
      </div>
      {/* </EmployeeFormProvider>  */}
    </div>
  
  );
}