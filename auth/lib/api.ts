import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.params) {
      config.params = { ...config.params, _t: Date.now() };
    } else {
      config.params = { _t: Date.now() };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (try refresh once)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await fetch('/api/token/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const { accessToken } = await response.json();
          setAuthToken(accessToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api.request(originalRequest);
        } else {
          // Refresh failed - redirect to signin
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin?error=SessionExpired';
          }
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin?error=SessionExpired';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 429) {
      const customError = new Error('Rate limit exceeded. Please try again later.');
      return Promise.reject(customError);
    }

    if (error.response?.status === 409) {
      const message = error.response.data?.message || 'Duplicate content detected';
      const customError = new Error(message);
      return Promise.reject(customError);
    }

    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_token', token);
  }
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
  }
};

export const configureApiWithAuth = async () => {
  try {
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('auth_token');
      if (storedToken) {
        setAuthToken(storedToken);
        return true;
      }
    }

    const response = await fetch('/api/token', {
      credentials: 'include',
    });

    if (response.ok) {
      const { accessToken } = await response.json();
      setAuthToken(accessToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return false;
  }
};