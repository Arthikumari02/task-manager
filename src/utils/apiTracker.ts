/**
 * API Tracker - A centralized mechanism to track and prevent duplicate API calls
 * 
 * This utility provides a way to track ongoing API calls by their unique keys
 * and prevent duplicate calls to the same endpoint with the same parameters.
 */

type PromiseRecord = Record<string, Promise<any>>;

class ApiTracker {
  private promises: PromiseRecord = {};

  /**
   * Track an API call and return the existing promise if one is already in progress
   * @param key Unique identifier for the API call (e.g., 'fetchUserInfo', 'fetchBoards-orgId123')
   * @param promiseFactory Function that creates the promise for the API call
   * @returns Promise for the API call
   */
  trackPromise<T>(key: string, promiseFactory: () => Promise<T>): Promise<T> {
    // If there's already a promise in progress for this key, return it
    const existingPromise = this.promises[key];
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // Create a new promise and store it
    const promise = promiseFactory().finally(() => {
      // Clean up the promise when it's done
      delete this.promises[key];
    });

    this.promises[key] = promise;
    return promise;
  }

  /**
   * Check if an API call is in progress
   * @param key Unique identifier for the API call
   * @returns True if the API call is in progress
   */
  isPromiseInProgress(key: string): boolean {
    return !!this.promises[key];
  }

  /**
   * Clear all tracked promises (use with caution, mainly for testing or reset)
   */
  clearAllPromises(): void {
    this.promises = {};
  }
}

// Export a singleton instance
export const apiTracker = new ApiTracker();

// Helper hook for React components
export const useApiTracker = () => {
  return apiTracker;
};
