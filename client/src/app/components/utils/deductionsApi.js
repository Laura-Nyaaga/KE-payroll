// import api, {BASE_URL} from "@/app/config/api";
// /**
//  * Fetches employees with their deductions for a specific company.
//  * This function will now automatically send authentication cookies.
//  * @returns {Promise<Array>} A promise that resolves to an array of employees with deductions.
//  * @throws {Error} If the companyId is not found in local storage or if the API call fails.
//  */
// export const fetchEmployeesWithDeductions = async () => {
//   try {
//     const companyId = localStorage.getItem('companyId'); // Dynamically get companyId from local storage

//     if (!companyId) {
 
//       throw new Error('Company ID not found in local storage. Cannot fetch employees with deductions.');
//     }

//     // Use the configured 'api' instance for GET request.
//     // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
//     const response = await api.get(`${BASE_URL}/deductions/companies/${companyId}/employees-with-deductions`);
//     return response.data; // Axios automatically parses JSON to response.data
//   } catch (error) {
//     console.error('Error fetching employees with deductions:', error);
//     // Rethrow the error so calling components can handle it (e.g., set an error state)
//     throw error;
//   }
// };

// /**
//  * Updates an existing employee deduction.
//  * This function will now automatically send authentication cookies.
//  * @param {string} deductionId - The ID of the employee deduction to update.
//  * @param {object} updateData - The data to update the deduction with.
//  * @returns {Promise<object>} A promise that resolves to the updated deduction object.
//  */
// export const updateEmployeeDeduction = async (deductionId, updateData) => {
//   try {
//     // Use the configured 'api' instance for PATCH request.
//     // 'Content-Type': 'application/json' is handled by the 'api' instance setup.
//     // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
//     const response = await api.patch(
//       `${BASE_URL}/deductions/employee-deductions/${deductionId}`,
//       updateData
//     );
//     return response.data; // Axios automatically parses JSON to response.data
//   } catch (error) {
//     console.error('Error updating employee deduction:', error);
//     // Rethrow the error so calling components can handle it
//     throw error;
//   }
// };

import api from "@/app/config/api";

/**
 * Fetches employees with their deductions for a specific company.
 * @param {Date|null} startDate - Optional start date filter
 * @param {Date|null} endDate - Optional end date filter
 * @returns {Promise<Array>} A promise that resolves to an array of employees with deductions.
 */
export const fetchEmployeesWithDeductions = async (startDate = null, endDate = null) => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('This function can only be called in browser environment');
    }
    
    const companyId = localStorage.getItem('companyId');
    
    if (!companyId) {
      throw new Error('Company ID not found in local storage. Cannot fetch employees with deductions.');
    }

    console.log('Fetching employees with deductions for company ID:', companyId);

    // Build query parameters for date filtering
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString().split('T')[0]);
    }

    const queryString = params.toString();
    const url = `/deductions/companies/${companyId}/employees-with-deductions${queryString ? `?${queryString}` : ''}`;
    
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
    
    console.log('Returning employees with deductions data:', employeesData);
    return employeesData;
    
  } catch (error) {
    console.error('Error fetching employees with deductions:', error);
    
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
 * Updates an existing employee deduction.
 * @param {string} deductionId - The ID of the employee deduction to update.
 * @param {object} updateData - The data to update the deduction with.
 * @returns {Promise<object>} A promise that resolves to the updated deduction object.
 */
export const updateEmployeeDeduction = async (deductionId, updateData) => {
  try {
    console.log('Updating employee deduction:', deductionId, updateData);
    
    const response = await api.patch(
      `/deductions/employee-deductions/${deductionId}`,
      updateData
    );
    
    console.log('Update Response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Error updating employee deduction:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Update Error Status:', error.response.status);
      console.error('Update Error Data:', error.response.data);
    }
    
    throw error;
  }
};