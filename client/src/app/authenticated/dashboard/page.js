'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BASE_URL } from '../../config/api';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';


export default function DashboardPage() {
  const { user, company, isAuthenticated, logout } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState({
    employees: true,
    departments: true,
    projects: true
  });
  const [errors, setErrors] = useState({
    employees: '',
    departments: '',
    projects: ''
  });
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = async () => {
    try {
      // Reset loading states
      setLoading({
        employees: true,
        departments: true,
        projects: true
      });
      
      setErrors({
        employees: '',
        departments: '',
        projects: ''
      });

      const companyId = localStorage.getItem('companyId');

      // Fetch all data in parallel
      const [employeesRes, departmentsRes, projectsRes] = await Promise.allSettled([
        fetch(`${BASE_URL}/employees/company/${companyId}`),
        fetch(`${BASE_URL}/departments/companies/${companyId}`),
        fetch(`${BASE_URL}/projects/companies/${companyId}`)
      ]);

      const newMetrics = {};
      const newErrors = {...errors};

      // Process employees
      if (employeesRes.status === 'fulfilled' && employeesRes.value.ok) {
        const data = await employeesRes.value.json();
        newMetrics.employees = Array.isArray(data) ? data.length : 0;
      } else {
        newErrors.employees = 'Failed to load employee data';
      }

      // Process departments
      if (departmentsRes.status === 'fulfilled' && departmentsRes.value.ok) {
        const data = await departmentsRes.value.json();
        newMetrics.departments = Array.isArray(data) ? data.length : 0;
      } else {
        newErrors.departments = 'Failed to load department data';
      }

      // Process projects
      if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        newMetrics.projects = Array.isArray(data) ? data.length : 0;
      } else {
        newErrors.projects = 'Failed to load project data';
      }

      setMetrics(prev => ({
        ...prev,
        ...newMetrics
      }));
      setErrors(newErrors);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading({
        employees: false,
        departments: false,
        projects: false
      });
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Animation variants
  const counterVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  const SkeletonLoader = () => (
    <div className="animate-pulse bg-gray-200 rounded-lg h-24 w-full"></div>
  );

  const MetricCard = ({
    title,
    value,
    isLoading,
    error
  }) => {
    if (isLoading) return <SkeletonLoader />;
    
    if (error) return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <motion.p
          key={`${title}-${value}`}
          initial="initial"
          animate="animate"
          variants={counterVariants}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold"
        >
          {value ?? 0}
        </motion.p>
      </div>
    );
  };

  return (
    <div className="p-6">
       {/* <h1>Welcome {user.firstName}!</h1> */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-black font-bold">Dashboard Overview</h1>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          )}
          <button 
            onClick={fetchData}
            disabled={Object.values(loading).some(Boolean)}
            className={`px-3 py-1 rounded ${
              Object.values(loading).some(Boolean) 
                ? 'bg-gray-300' 
                : 'bg-blue-500 hover:bg-blue-700'
            } text-white`}
          >
            {Object.values(loading).some(Boolean) ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
        <MetricCard
          title="Employees"
          value={metrics?.employees}
          isLoading={loading.employees}
          error={errors.employees}
        />
        
        <MetricCard
          title="Departments"
          value={metrics?.departments}
          isLoading={loading.departments}
          error={errors.departments}
        />
        
        <MetricCard
          title="Projects"
          value={metrics?.projects}
          isLoading={loading.projects}
          error={errors.projects}
        />
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl text-black font-semibold mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <Link 
            href="/authenticated/dashboard/addEmployee" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Employee
          </Link>
          <Link 
              href="/authenticated/hr/departments"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Department
          </Link>
          <Link 
              href="/authenticated/hr/projects"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Project
          </Link>
        </div>
      </div>
    </div>
  );
}