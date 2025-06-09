
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.100.84:4000/api';
// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.245.210:4000/api';

// Improved fetch with timeout and better error handling
async function fetchWithAuth(url, options = {}) {
  try {
    // Get auth token
    let token;
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add auth token if available
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Make the request
    const response = await fetch(BASE_URL + url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `HTTP error ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    // Improve error messaging
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server took too long to respond');
    }
    
    // Network errors don't have response details
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error - please check your connection or the server status');
    }
    
    throw error;
  }
}

// API endpoints
const apiClient = {
  // Add auth methods
  auth: {
    login: async (credentials) => {
      try {
        return await fetchWithAuth('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
      } catch (error) {
        console.error('Error during login:', error);
        throw error;
      }
    },
    register: async (userData) => {
      try {
        return await fetchWithAuth('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
      } catch (error) {
        console.error('Error during registration:', error);
        throw error;
      }
    }
  },
  
  employees: {
    getAll: async () => {
      try {
        return await fetchWithAuth('/employees');
      } catch (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
    },
    
    create: async (employeeData) => {
      try {
        return await fetchWithAuth('/employees', {
          method: 'POST',
          body: JSON.stringify(employeeData),
        });
      } catch (error) {
        console.error('Error creating employee:', error);
        throw error;
      }
    },
    
    getById: async (id) => {
      try {
        return await fetchWithAuth(`/employees/${id}`);
      } catch (error) {
        console.error(`Error fetching employee ${id}:`, error);
        throw error;
      }
    }
  }
};

// Export the API client
export default apiClient;

// Also export the BASE_URL for use elsewhere
export { BASE_URL };