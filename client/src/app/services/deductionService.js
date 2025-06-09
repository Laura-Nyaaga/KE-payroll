// services/deductionService.js
import { apiRoutes } from './apiRoutes';
import api from '../config/api';

// Initial data for development/testing - remove in production
const initialDeductions = [
  { 
    id: '1', 
    title: 'N.S.S.F', 
    rateType: 'Monthly', 
    applicableRelief: 'Retirement Fund',
    isStatutory: true
  },
  { 
    id: '2', 
    title: 'S.H.I.F', 
    rateType: 'Monthly', 
    applicableRelief: 'Insurance Relief',
    isStatutory: true
  },
  { 
    id: '3', 
    title: 'Housing Levy', 
    rateType: 'Monthly', 
    applicableRelief: 'Housing Relief',
    isStatutory: true
  },
  { 
    id: '4', 
    title: 'Salary Advance', 
    rateType: 'Monthly', 
    applicableRelief: 'None',
    isStatutory: true
  },
  { 
    id: '5', 
    title: 'Absenteeism', 
    rateType: 'Daily', 
    applicableRelief: 'None',
    isStatutory: false
  }
];

// In-memory store for development - replace with database calls in production
let deductions = [...initialDeductions];

export const DeductionService = {
  /**
   * Get all deductions
   * @returns {Promise<Array>} Array of deduction objects
   */
  getAllDeductions: async () => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.get(apiRoutes.payrollSettings.deductions.getAll);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // return Promise.resolve([...deductions]);
    } catch (error) {
      console.error('Error fetching deductions:', error);
      throw error;
    }
  },

  /**
   * Create a new deduction
   * @param {Object} deduction - The deduction to create
   * @returns {Promise<Object>} The created deduction
   */
  createDeduction: async (deduction) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.post(apiRoutes.payrollSettings.deductions.create, deduction);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const newDeduction = {
      //   ...deduction,
      //   id: (deductions.length + 1).toString()
      // };
      // 
      // deductions.push(newDeduction);
      // return Promise.resolve(newDeduction);
    } catch (error) {
      console.error('Error creating deduction:', error);
      throw error;
    }
  },

  /**
   * Update multiple deductions at once
   * @param {Array} updatedDeductions - Array of deduction objects to update
   * @returns {Promise<void>}
   */
  updateDeductions: async (updatedDeductions) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.put(apiRoutes.payrollSettings.deductions.updateBulk, updatedDeductions);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // deductions = [...updatedDeductions];
      // return Promise.resolve();
    } catch (error) {
      console.error('Error updating deductions:', error);
      throw error;
    }
  },

  /**
   * Update a single deduction
   * @param {string} id - ID of the deduction to update
   * @param {Object} updatedData - New deduction data
   * @returns {Promise<Object>} The updated deduction
   */
  updateDeduction: async (id, updatedData) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.put(apiRoutes.payrollSettings.deductions.update(id), updatedData);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const index = deductions.findIndex(d => d.id === id);
      // 
      // if (index === -1) {
      //   throw new Error(`Deduction with id ${id} not found`);
      // }
      // 
      // deductions[index] = { ...deductions[index], ...updatedData };
      // return Promise.resolve(deductions[index]);
    } catch (error) {
      console.error('Error updating deduction:', error);
      throw error;
    }
  },

  /**
   * Delete a deduction
   * @param {string} id - ID of the deduction to delete
   * @returns {Promise<void>}
   */
  deleteDeduction: async (id) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.delete(apiRoutes.payrollSettings.deductions.delete(id));
      return response.data;
      
      // For development, uncomment to use in-memory store
      // deductions = deductions.filter(d => d.id !== id);
      // return Promise.resolve();
    } catch (error) {
      console.error('Error deleting deduction:', error);
      throw error;
    }
  },

  /**
   * Export deductions to CSV format
   * @returns {Promise<Blob>} CSV blob
   */
  exportDeductions: async () => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.get(apiRoutes.payrollSettings.deductions.export, {
        responseType: 'blob'
      });
      return response.data;
      
      // For development, uncomment to use in-memory CSV generation
      // const allDeductions = await DeductionService.getAllDeductions();
      // 
      // // Create CSV header
      // const headers = ['ID', 'Title', 'Rate Type', 'Applicable Relief', 'Statutory'];
      // let csvContent = headers.join(',') + '\n';
      // 
      // // Add rows
      // allDeductions.forEach(deduction => {
      //   const row = [
      //     deduction.id,
      //     `"${deduction.title}"`, // Wrap in quotes to handle commas in titles
      //     deduction.rateType,
      //     deduction.applicableRelief,
      //     deduction.isStatutory ? 'Yes' : 'No'
      //   ];
      //   
      //   csvContent += row.join(',') + '\n';
      // });
      // 
      // // Convert to blob
      // const blob = new Blob([csvContent], { type: 'text/csv' });
      // return Promise.resolve(blob);
    } catch (error) {
      console.error('Error exporting deductions:', error);
      throw error;
    }
  }
};