// services/employeeApi.js
import api from './apiRoutes';

const employeeApi = {
  // Get all employees
  getEmployees: async () => {
    try {
      const response = await api.get('/employees');
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },
  
  // Get employee by ID
  getEmployeeById: async (id) => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching employee with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create new employee
  createEmployee: async (employeeData) => {
    try {
      const response = await api.post('/employees', employeeData);
      return response.data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },
  
  // Upload employee document
  uploadEmployeeDocument: async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await api.post('/employees/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },
  
  // Get job titles
  getJobTitles: async () => {
    try {
      const response = await api.get('/job-titles');
      return response.data;
    } catch (error) {
      console.error('Error fetching job titles:', error);
      return { data: [] }; // Return empty array as fallback
    }
  },
  
  // Get departments
  getDepartments: async () => {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      return { data: [] }; // Return empty array as fallback
    }
  },
  
  // Get projects
  getProjects: async () => {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { data: [] }; // Return empty array as fallback
    }
  }
};

export default employeeApi;







