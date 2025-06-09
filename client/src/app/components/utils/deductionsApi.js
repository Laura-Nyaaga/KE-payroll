import api, {BASE_URL} from "@/app/config/api";
/**
 * Fetches employees with their deductions for a specific company.
 * This function will now automatically send authentication cookies.
 * @returns {Promise<Array>} A promise that resolves to an array of employees with deductions.
 * @throws {Error} If the companyId is not found in local storage or if the API call fails.
 */
export const fetchEmployeesWithDeductions = async () => {
  try {
    const companyId = localStorage.getItem('companyId'); // Dynamically get companyId from local storage

    if (!companyId) {
 
      throw new Error('Company ID not found in local storage. Cannot fetch employees with deductions.');
    }

    // Use the configured 'api' instance for GET request.
    // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
    const response = await api.get(`${BASE_URL}/deductions/companies/${companyId}/employees-with-deductions`);
    return response.data; // Axios automatically parses JSON to response.data
  } catch (error) {
    console.error('Error fetching employees with deductions:', error);
    // Rethrow the error so calling components can handle it (e.g., set an error state)
    throw error;
  }
};

/**
 * Updates an existing employee deduction.
 * This function will now automatically send authentication cookies.
 * @param {string} deductionId - The ID of the employee deduction to update.
 * @param {object} updateData - The data to update the deduction with.
 * @returns {Promise<object>} A promise that resolves to the updated deduction object.
 */
export const updateEmployeeDeduction = async (deductionId, updateData) => {
  try {
    // Use the configured 'api' instance for PATCH request.
    // 'Content-Type': 'application/json' is handled by the 'api' instance setup.
    // 'withCredentials: true' is handled by the 'api' instance setup in config/api.js.
    const response = await api.patch(
      `${BASE_URL}/deductions/employee-deductions/${deductionId}`,
      updateData
    );
    return response.data; // Axios automatically parses JSON to response.data
  } catch (error) {
    console.error('Error updating employee deduction:', error);
    // Rethrow the error so calling components can handle it
    throw error;
  }
};
