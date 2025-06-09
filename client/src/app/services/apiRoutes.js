import { BASE_URL, ENDPOINTS } from "../config/api";
import axios from 'axios';

const getCompanyId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('companyId') || '';
  }
  return '';
};

export const apiRoutes = {
  // Auth routes - using your existing ENDPOINTS
  auth: {
    login: ENDPOINTS.LOGIN,
    register: ENDPOINTS.REGISTER,
  },

  // Payroll settings routes - extending your structure
  payrollSettings: {
    // Deductions endpoints
    deductions: {
      getAll: `${BASE_URL}/deductions/company/${getCompanyId()}`,
      getById: (id) => `${BASE_URL}/deductions/${id}`,
      create: `${BASE_URL}/deductions`,
      update: (id) => `${BASE_URL}/deductions/${id}`,
      // updateBulk: '/payroll/deductions/bulk',
      // delete: (id) => `/payroll/deductions/${id}`,
      export: '/payroll/deductions/export',
    },

// Allowances endpoints 
allowances: {
  getAll: `${BASE_URL}/allowances/company/${getCompanyId()}`,
  getById: (id) => `/payroll/allowances/${id}`,
  create: '/payroll/allowances',
  update: (id) => `${BASE_URL}/allowances/${id}`,
  updateBulk: '/payroll/allowances/bulk',
  delete: (id) => `/payroll/allowances/${id}`,
  export: '/payroll/allowances/export',
},
    
    // Earnings endpoints
    earnings: {
      getAll: `${BASE_URL}/earnings/company/${getCompanyId()}`,
      getById: (id) => `/payroll/earnings/${id}`,
      create: '/payroll/earnings',
      update: (id) => `/payroll/earnings/${id}`,
      updateBulk: '/payroll/earnings/bulk',
      delete: (id) => `/payroll/earnings/${id}`,
      export: '/payroll/earnings/export',
    },
    
    // Loans endpoints
    loans: {
      getAll: '/payroll/loans',
      getById: (id) => `/payroll/loans/${id}`,
      create: '/payroll/loans',
      update: (id) => `/payroll/loans/${id}`,
      updateBulk: '/payroll/loans/bulk',
      delete: (id) => `/payroll/loans/${id}`,
      export: '/payroll/loans/export',
    },

    // Payslips - using your existing ENDPOINTS
    payslips: {
      getAll: ENDPOINTS.PAYSLIPS,
      getById: (id) => `${ENDPOINTS.PAYSLIPS}/${id}`,
      create: ENDPOINTS.PAYSLIPS,
      generate: `${ENDPOINTS.PAYSLIPS}/generate`,
    },
  },

};