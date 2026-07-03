import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  (config) => {
    // 1. Add Authorization Header
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Comprehensive Request Logging
    console.log(
      `%c[API Request] %c${config.method.toUpperCase()} %c${config.url}`,
      'color: #007bff; font-weight: bold',
      'color: #ff9900; font-weight: bold',
      'color: inherit',
      '\nHeaders:', config.headers,
      '\nPayload:', config.data || '(none)'
    );

    // Track request start time
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => {
    // 1. Comprehensive Response Logging
    const duration = new Date() - response.config.metadata.startTime;
    console.log(
      `%c[API Response] %c${response.status} %c${response.config.url} %c(+${duration}ms)`,
      'color: #28a745; font-weight: bold',
      'color: #28a745; font-weight: bold',
      'color: inherit',
      'color: #888',
      '\nResponse Body:', response.data
    );

    return response;
  },
  (error) => {
    // Calculate duration even on error
    const duration = error.config?.metadata?.startTime 
      ? new Date() - error.config.metadata.startTime 
      : 0;

    // 1. Extract exactly what went wrong
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const url = error.config ? error.config.url : 'Unknown URL';
    
    console.error(
      `%c[API Error] %c${status} %c${url} %c(+${duration}ms)`,
      'color: #dc3545; font-weight: bold',
      'color: #dc3545; font-weight: bold',
      'color: inherit',
      'color: #888',
      '\nError Details:', error.response?.data || error.message
    );

    // 2. Handle specific errors (like Authentication failure)
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');

      // If the failed request was to a superadmin endpoint, redirect to superadmin login
      const requestUrl = error.config?.url || '';
      if (requestUrl.includes('superadmin')) {
        window.location.href = '/superadmin/login';
      } else {
        window.location.href = '/';
      }
    }

    // 3. Normalize Error Messages (Fixes the "swallowed error" issue)
    let descriptiveMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const responseData = error.response.data;

      if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE html>')) {
         // The backend returned an HTML page (like a 404 router error)
         if (status === 404) descriptiveMessage = `API endpoint not found on server (404).`;
         else if (status >= 500) descriptiveMessage = `Server encountered an internal error (${status}).`;
         else descriptiveMessage = `Server returned an invalid HTML response (${status}).`;
      } else if (responseData && responseData.message) {
         // Standard NexusProctor backend JSON error
         descriptiveMessage = responseData.message;
      } else {
         descriptiveMessage = `Server error (${status}).`;
      }
    } else if (error.request) {
      descriptiveMessage = 'No response from server. Check your network connection.';
    } else {
      descriptiveMessage = error.message;
    }

    // Attach our descriptive message directly to the error object 
    error.normalizedMessage = descriptiveMessage;

    return Promise.reject(error);
  }
);

export default api;