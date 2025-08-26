/**
 * Common API utilities for making requests to Trello API
 */
import { getAuthData } from './auth';

/**
 * API response interface
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Base URL for Trello API
 */
export const API_BASE_URL = 'https://api.trello.com/1';

/**
 * Makes an authenticated GET request to the Trello API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<ApiResponse<T>>} Response data or error
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  const { token, clientId } = getAuthData();
  
  if (!token || !clientId) {
    return {
      data: null,
      error: 'Authentication credentials not available',
      status: 401
    };
  }
  
  try {
    // Add auth params to URL
    const authParams = `key=${clientId}&token=${token}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}${authParams}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        data: null,
        error: `API error: ${response.statusText}`,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    return {
      data,
      error: null,
      status: response.status
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500
    };
  }
}

/**
 * Makes an authenticated POST request to the Trello API
 * @param {string} endpoint - API endpoint path
 * @param {object} body - Request body
 * @returns {Promise<ApiResponse<T>>} Response data or error
 */
export async function apiPost<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
  const { token, clientId } = getAuthData();
  
  if (!token || !clientId) {
    return {
      data: null,
      error: 'Authentication credentials not available',
      status: 401
    };
  }
  
  try {
    // Add auth params to URL
    const authParams = `key=${clientId}&token=${token}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}${authParams}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return {
        data: null,
        error: `API error: ${response.statusText}`,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    return {
      data,
      error: null,
      status: response.status
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500
    };
  }
}

/**
 * Makes an authenticated PUT request to the Trello API
 * @param {string} endpoint - API endpoint path
 * @param {object} body - Request body
 * @returns {Promise<ApiResponse<T>>} Response data or error
 */
export async function apiPut<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
  const { token, clientId } = getAuthData();
  
  if (!token || !clientId) {
    return {
      data: null,
      error: 'Authentication credentials not available',
      status: 401
    };
  }
  
  try {
    // Add auth params to URL
    const authParams = `key=${clientId}&token=${token}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}${authParams}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return {
        data: null,
        error: `API error: ${response.statusText}`,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    return {
      data,
      error: null,
      status: response.status
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500
    };
  }
}

/**
 * Makes an authenticated DELETE request to the Trello API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<ApiResponse<T>>} Response data or error
 */
export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  const { token, clientId } = getAuthData();
  
  if (!token || !clientId) {
    return {
      data: null,
      error: 'Authentication credentials not available',
      status: 401
    };
  }
  
  try {
    // Add auth params to URL
    const authParams = `key=${clientId}&token=${token}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}${separator}${authParams}`;
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      return {
        data: null,
        error: `API error: ${response.statusText}`,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    return {
      data,
      error: null,
      status: response.status
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 500
    };
  }
}
