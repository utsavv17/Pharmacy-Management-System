import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const orgId = localStorage.getItem('organization_id');
  if (orgId) {
    config.headers['X-Organization-ID'] = orgId;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Globally format FastAPI errors into a single readable string
    let errorMessage = '';
    const data = error.response?.data;
    
    if (data) {
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err: any) => {
          const field = err.loc?.slice(-1)[0] || 'Field';
          return `${field}: ${err.msg}`;
        }).join(', ');
      } else if (data.detail?.message) {
        errorMessage = data.detail.message;
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      // Inject the clean string back into both properties 
      // so any component reading .detail or .message gets the formatted text!
      if (errorMessage) {
        data.detail = errorMessage;
        data.message = errorMessage;
      }
    }
    
    return Promise.reject(error);
  }
);
