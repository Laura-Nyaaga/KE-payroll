// services/allowanceService.js
import api from './api';
import { apiRoutes } from './apiRoutes';

// Initial data for development/testing - remove in production
const initialAllowances = [
  { 
    id: '1', 
    title: 'House Allowance', 
    rateType: 'Monthly', 
    taxable: 'Taxable'
  },
  { 
    id: '2', 
    title: 'Food Allowance', 
    rateType: 'Monthly', 
    taxable: 'Taxable'
  },
  { 
    id: '3', 
    title: 'Transport Allowance', 
    rateType: 'Monthly', 
    taxable: 'Taxable'
  },
  { 
    id: '4', 
    title: 'Per Diem', 
    rateType: 'Per Day', 
    taxable: 'Taxable'
  }
];

// In-memory store for development - replace with API calls in production
let allowances = [...initialAllowances];

export const AllowanceService = {
  /**
   * Get all allowances
   * @returns {Promise<Array>} Array of allowance objects
   */
  getAllAllowances: async () => {
    try {
      // In production, use the API call
      const response = await api.get(apiRoutes.payrollSettings.allowances.getAll);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // return Promise.resolve([...allowances]);
    } catch (error) {
      console.error('Error fetching allowances:', error);
      throw error;
    }
  },

  /**
   * Create a new allowance
   * @param {Object} allowance - The allowance to create
   * @returns {Promise<Object>} The created allowance
   */
  createAllowance: async (allowance) => {
    try {
      // In production, use the API call
      const response = await api.post(apiRoutes.payrollSettings.allowances.create, allowance);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const newAllowance = {
      //   ...allowance,
      //   id: (allowances.length + 1).toString()
      // };
      // 
      // allowances.push(newAllowance);
      // return Promise.resolve(newAllowance);
    } catch (error) {
      console.error('Error creating allowance:', error);
      throw error;
    }
  },

  /**
   * Update multiple allowances at once
   * @param {Array} updatedAllowances - Array of allowance objects to update
   * @returns {Promise<void>}
   */
  updateAllowances: async (updatedAllowances) => {
    try {
      // In production, use the API call
      const response = await api.put(apiRoutes.payrollSettings.allowances.updateBulk, updatedAllowances);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // allowances = [...updatedAllowances];
      // return Promise.resolve();
    } catch (error) {
      console.error('Error updating allowances:', error);
      throw error;
    }
  },

  /**
   * Update a single allowance
   * @param {string} id - ID of the allowance to update
   * @param {Object} updatedData - New allowance data
   * @returns {Promise<Object>} The updated allowance
   */
  updateAllowance: async (id, updatedData) => {
    try {
      // In production, use the API call
      const response = await api.put(apiRoutes.payrollSettings.allowances.update(id), updatedData);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const index = allowances.findIndex(a => a.id === id);
      // 
      // if (index === -1) {
      //   throw new Error(`Allowance with id ${id} not found`);
      // }
      // 
      // allowances[index] = { ...allowances[index], ...updatedData };
      // return Promise.resolve(allowances[index]);
    } catch (error) {
      console.error('Error updating allowance:', error);
      throw error;
    }
  },

  /**
   * Delete an allowance
   * @param {string} id - ID of the allowance to delete
   * @returns {Promise<void>}
   */
  deleteAllowance: async (id) => {
    try {
      // In production, use the API call
      const response = await api.delete(apiRoutes.payrollSettings.allowances.delete(id));
      return response.data;
      
      // For development, uncomment to use in-memory store
      // allowances = allowances.filter(a => a.id !== id);
      // return Promise.resolve();
    } catch (error) {
      console.error('Error deleting allowance:', error);
      throw error;
    }
  },

  /**
   * Export allowances to CSV format
   * @returns {Promise<Blob>} CSV blob
   */
  exportAllowances: async () => {
    try {
      // In production, use the API call
      const response = await api.get(apiRoutes.payrollSettings.allowances.export, {
        responseType: 'blob'
      });
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const allAllowances = await AllowanceService.getAllAllowances();
      // 
      // // Create CSV header
      // const headers = ['ID', 'Title', 'Rate Type', 'Taxable'];
      // let csvContent = headers.join(',') + '\n';
      // 
      // // Add rows
      // allAllowances.forEach(allowance => {
      //   const row = [
      //     allowance.id,
      //     `"${allowance.title}"`, // Wrap in quotes to handle commas in titles
      //     allowance.rateType,
      //     allowance.taxable
      //   ];
      //   
      //   csvContent += row.join(',') + '\n';
      // });
      // 
      // // Convert to blob
      // const blob = new Blob([csvContent], { type: 'text/csv' });
      // return Promise.resolve(blob);
    } catch (error) {
      console.error('Error exporting allowances:', error);
      throw error;
    }
  }
};