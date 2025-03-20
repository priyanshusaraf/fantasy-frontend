import { env } from './env';
import type { ApiResponse } from './api-middleware';

const API_BASE_URL = env.NEXT_PUBLIC_APP_URL;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: HeadersInit;
  cache?: RequestCache;
  tags?: string[];
};

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    throw new Error('Network response was not ok');
  }

  if (isJson) {
    const data = await response.json();
    return data as T;
  }

  throw new Error('Response was not JSON');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    cache,
    tags,
  } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/api${endpoint}`;

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include',
    cache,
    next: tags ? { tags } : undefined,
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);
    return handleResponse<T>(response);
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

export async function get<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export async function post<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body: data });
}

export async function put<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PUT', body: data });
}

export async function del<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

export async function patch<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body: data });
} 