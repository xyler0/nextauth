import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const configureApiWithAuth = async () => {
  try {
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