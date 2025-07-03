import api from "@/app/config/api";

/**
 * Fetches employees with their earnings for a specific company.
 * @param {Date|null} startDate - Optional start date filter
 * @param {Date|null} endDate - Optional end date filter
 * @returns {Promise<Array>} A promise that resolves to an array of employees with earnings.
 */
export const fetchEmployeesWithEarnings = async (startDate = null, endDate = null) => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called in browser environment');
    }
    
    const companyId = localStorage.getItem('companyId');
    
    if (!companyId) {
      throw new Error('Company ID not found in local storage. Cannot fetch employees with earnings.');
    }

    console.log('Fetching employees for company ID:', companyId);

    // Build query parameters for date filtering
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }

    const queryString = params.toString();
    const url = `/earnings/companies/${companyId}/employees-with-earnings${queryString ? `?${queryString}` : ''}`;
    
    console.log('API URL:', url);

    const response = await api.get(url);
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', response.data);
    
    // Ensure we return an array
    let employeesData = [];
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        employeesData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        employeesData = response.data.data;
      } else if (response.data.employees && Array.isArray(response.data.employees)) {
        employeesData = response.data.employees;
      } else {
        console.warn('Unexpected response structure, using empty array:', response.data);
        employeesData = [];
      }
    }
    
    console.log('Returning employees data:', employeesData);
    return employeesData;
    
  } catch (error) {
    console.error('Error fetching employees with earnings:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
      console.error('Error Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    
    // Always return an empty array on error to prevent filter issues
    return [];
  }
};

/**
 * Updates an existing employee earning.
 * @param {string} earningId - The ID of the employee earning to update.
 * @param {object} updateData - The data to update the earning with.
 * @returns {Promise<object>} A promise that resolves to the updated earning object.
 */
export const updateEmployeeEarning = async (earningId, updateData) => {
  try {
    console.log('Updating employee earning:', earningId, updateData);
    
    const response = await api.patch(
      `/earnings/employee-earnings/${earningId}`,
      updateData
    );
    
    console.log('Update Response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Error updating employee earning:', error);
    
    if (error.response) {
      console.error('Update Error Status:', error.response.status);
      console.error('Update Error Data:', error.response.data);
    }
    
    throw error;
  }
};

