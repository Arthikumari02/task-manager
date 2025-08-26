/**
 * Common authentication utilities for the application
 * Centralizes authentication-related functionality
 */

/**
 * Authentication data interface
 */
export interface AuthData {
  token: string | null;
  clientId: string | null;
}

/**
 * Gets authentication data from localStorage
 * @returns {AuthData} Object containing token and clientId
 */
export const getAuthData = (): AuthData => {
  return {
    token: localStorage.getItem('trello_token'),
    clientId: localStorage.getItem('trello_key')
  };
};

/**
 * Checks if the user is authenticated
 * @returns {boolean} True if user has valid auth credentials
 */
export const isAuthenticated = (): boolean => {
  const { token, clientId } = getAuthData();
  return !!token && !!clientId;
};

/**
 * Builds API URL with authentication parameters
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL with auth params
 */
export const buildAuthenticatedUrl = (endpoint: string): string => {
  const { token, clientId } = getAuthData();
  
  if (!token || !clientId) {
    throw new Error('Authentication credentials not available');
  }
  
  const baseUrl = 'https://api.trello.com/1';
  const authParams = `key=${clientId}&token=${token}`;
  
  // Handle endpoints that already have query parameters
  const separator = endpoint.includes('?') ? '&' : '?';
  
  return `${baseUrl}${endpoint}${separator}${authParams}`;
};

/**
 * Clears authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('trello_token');
  localStorage.removeItem('trello_key');
};
