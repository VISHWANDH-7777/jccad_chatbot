import axios from 'axios';

const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '';

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
};

export const configureApiClient = (): void => {
  axios.defaults.baseURL = API_BASE_URL || undefined;
  axios.defaults.withCredentials = true;
};
