/**
 * Utility functions for Trello OAuth authentication
 */

/**
 * Gets the return URL for Trello OAuth callback
 * This URL should be added to your Trello application's Allowed Origins
 * @returns {string} The complete return URL for OAuth callback
 */
export const getReturnURL = (): string => {
  // Use the current page URL as return URL for simplicity
  // This should now be http://localhost:3001
  return window.location.origin;
};

/**
 * Builds the complete Trello OAuth authorization URL
 * @param clientId - Your Trello application client ID
 * @returns {string} Complete OAuth URL for authorization
 */
export const buildTrelloAuthURL = (clientId: string): string => {
  const returnURL = getReturnURL();
  
  const params = new URLSearchParams({
    expiration: 'never',
    name: 'TaskManager',
    scope: 'read,write,account',
    key: clientId,
    callback_method: 'fragment',
    return_url: returnURL
  });

  return `https://trello.com/1/OAuthAuthorizeToken?${params.toString()}`;
};

/**
 * Extracts the OAuth token from URL fragment
 * @param fragment - URL hash fragment containing token
 * @returns {string | null} Extracted token or null if not found
 */
export const extractTokenFromFragment = (fragment: string): string | null => {
  if (!fragment.includes('token=')) {
    return null;
  }
  
  const tokenMatch = fragment.match(/token=([^&]+)/);
  return tokenMatch ? tokenMatch[1] : null;
};

/**
 * Cleans up the URL after OAuth callback
 * Removes the hash fragment containing sensitive token information
 */
export const cleanupOAuthURL = (): void => {
  window.history.replaceState({}, document.title, window.location.pathname);
};
