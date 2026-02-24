import axios, { AxiosError } from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN || '';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: unknown
  ) {
    super(message);
  }
}

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: string }>;
      throw new ApiError(
        axiosErr.response?.data?.error ?? axiosErr.message,
        axiosErr.response?.status ?? 0,
        axiosErr.response?.data
      );
    }
    throw error;
  }
}

export async function apiPost<T>(
  url: string,
  data?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<{ error?: string }>;
      throw new ApiError(
        axiosErr.response?.data?.error ?? axiosErr.message,
        axiosErr.response?.status ?? 0,
        axiosErr.response?.data
      );
    }
    throw error;
  }
}

/**
 * Switch the active auth token. Useful for testing two-sided
 * conversations — call this with the User B token to see
 * the other side of a conversation, then switch back.
 */
export function setAuthToken(token: string) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default apiClient;
