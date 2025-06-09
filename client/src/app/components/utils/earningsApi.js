import api, {BASE_URL} from "@/app/config/api";
/**
 * Fetches employees with their deductions for a specific company.
 * This function will now automatically send authentication cookies.
 * @returns {Promise<Array>} A promise that resolves to an array of employees with deductions.
 * @throws {Error} If the companyId is not found in local storage or if the API call fails.
 */
export const fetchEmployeesWithEarnings = async () => {
  try {
    const companyId = localStorage.getItem('companyId'); // Dynamically get companyId from local storage

    if (!companyId) {
      // It's crucial to handle cases where companyId might be missing.
      // You might want to redirect to login or show a specific error message in your UI.
      throw new Error('Company ID not found in local storage. Cannot fetch employees with deductions.');
    }

    // Use the configured 'api' instance for GET request.
    // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
    const response = await api.get(`${BASE_URL}/earnings/companies/${companyId}/employees-with-earnings`);
    return response.data; // Axios automatically parses JSON to response.data
  } catch (error) {
    console.error('Error fetching employees with earnings:', error);
    // Rethrow the error so calling components can handle it (e.g., set an error state)
    throw error;
  }
};

/**
 * Updates an existing employee deduction.
 * This function will now automatically send authentication cookies.
 * @param {string} earningId - The ID of the employee deduction to update.
 * @param {object} updateData - The data to update the deduction with.
 * @returns {Promise<object>} A promise that resolves to the updated deduction object.
 */
export const updateEmployeeEarning = async (earningId, updateData) => {
  try {
    // Use the configured 'api' instance for PATCH request.
    // 'Content-Type': 'application/json' is handled by the 'api' instance setup.
    // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
    const response = await api.patch(
      `${BASE_URL}/earnings/employee-earnings/${earningId}`,
      updateData
    );
    return response.data; // Axios automatically parses JSON to response.data
  } catch (error) {
    console.error('Error updating employee earning:', error);
    // Rethrow the error so calling components can handle it
    throw error;
  }
};




