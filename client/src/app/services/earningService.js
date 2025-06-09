// services/earningService.js
import api from './api';
import { apiRoutes } from './apiRoutes';

// Initial data for development/testing - remove in production
const initialEarnings = [
  { 
    id: '1', 
    title: 'Bonus', 
    rateType: 'Monthly', 
    taxable: 'Taxable'
  },
  { 
    id: '2', 
    title: 'Commissions', 
    rateType: 'Monthly', 
    taxable: 'Taxable'
  },
  { 
    id: '3', 
    title: 'Overtime', 
    rateType: 'Monthly', 
    taxable: 'Non-Taxable'
  },
  { 
    id: '4', 
    title: 'Payment in Lieu of Leave', 
    rateType: 'Per Day', 
    taxable: 'Non-Taxable'
  }
];

// In-memory store for development - replace with API calls in production
let earnings = [...initialEarnings];

export const EarningService = {
  /**
   * Get all earnings
   * @returns {Promise<Array>} Array of earning objects
   */
  getAllEarnings: async () => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.get(apiRoutes.payrollSettings.earnings.getAll);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // return Promise.resolve([...earnings]);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      throw error;
    }
  },

  /**
   * Create a new earning
   * @param {Object} earning - The earning to create
   * @returns {Promise<Object>} The created earning
   */
  createEarning: async (earning) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.post(apiRoutes.payrollSettings.earnings.create, earning);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const newEarning = {
      //   ...earning,
      //   id: (earnings.length + 1).toString()
      // };
      // 
      // earnings.push(newEarning);
      // return Promise.resolve(newEarning);
    } catch (error) {
      console.error('Error creating earning:', error);
      throw error;
    }
  },

  /**
   * Update multiple earnings at once
   * @param {Array} updatedEarnings - Array of earning objects to update
   * @returns {Promise<void>}
   */
  updateEarnings: async (updatedEarnings) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.put(apiRoutes.payrollSettings.earnings.updateBulk, updatedEarnings);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // earnings = [...updatedEarnings];
      // return Promise.resolve();
    } catch (error) {
      console.error('Error updating earnings:', error);
      throw error;
    }
  },

  /**
   * Update a single earning
   * @param {string} id - ID of the earning to update
   * @param {Object} updatedData - New earning data
   * @returns {Promise<Object>} The updated earning
   */
  updateEarning: async (id, updatedData) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.put(apiRoutes.payrollSettings.earnings.update(id), updatedData);
      return response.data;
      
      // For development, uncomment to use in-memory store
      // const index = earnings.findIndex(e => e.id === id);
      // 
      // if (index === -1) {
      //   throw new Error(`Earning with id ${id} not found`);
      // }
      // 
      // earnings[index] = { ...earnings[index], ...updatedData };
      // return Promise.resolve(earnings[index]);
    } catch (error) {
      console.error('Error updating earning:', error);
      throw error;
    }
  },

  /**
   * Delete an earning
   * @param {string} id - ID of the earning to delete
   * @returns {Promise<void>}
   */
  deleteEarning: async (id) => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.delete(apiRoutes.payrollSettings.earnings.delete(id));
      return response.data;
      
      // For development, uncomment to use in-memory store
      // earnings = earnings.filter(e => e.id !== id);
      // return Promise.resolve();
    } catch (error) {
      console.error('Error deleting earning:', error);
      throw error;
    }
  },

  /**
   * Export earnings to CSV format
   * @returns {Promise<Blob>} CSV blob
   */
  exportEarnings: async () => {
    try {
      // Use the API call with proper route from apiRoutes
      const response = await api.get(apiRoutes.payrollSettings.earnings.export, {
        responseType: 'blob'
      });
      return response.data;
      
      // For development, uncomment to use in-memory CSV generation
      // const allEarnings = await EarningService.getAllEarnings();
      // 
      // // Create CSV header
      // const headers = ['ID', 'Title', 'Rate Type', 'Taxable'];
      // let csvContent = headers.join(',') + '\n';
      // 
      // // Add rows
      // allEarnings.forEach(earning => {
      //   const row = [
      //     earning.id,
      //     `"${earning.title}"`, // Wrap in quotes to handle commas in titles
      //     earning.rateType,
      //     earning.taxable
      //   ];
      //   
      //   csvContent += row.join(',') + '\n';
      // });
      // 
      // // Convert to blob
      // const blob = new Blob([csvContent], { type: 'text/csv' });
      // return Promise.resolve(blob);
    } catch (error) {
      console.error('Error exporting earnings:', error);
      throw error;
    }
  }
};