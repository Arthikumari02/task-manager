export interface BaseStoreState {
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
}

export class BaseStore {
  protected state: BaseStoreState = {
    isLoading: false,
    error: null,
    isCreating: false,
  };

  protected setState: (updater: (prev: any) => any) => void;
  protected token: string | null;
  protected clientId: string | null;

  constructor(setState: (updater: (prev: any) => any) => void, token: string | null, clientId: string | null) {
    this.setState = setState;
    this.token = token;
    this.clientId = clientId;
  }

  protected setLoading(loading: boolean) {
    this.setState((prev: any) => ({ ...prev, isLoading: loading }));
  }

  protected setError(error: string | null) {
    this.setState((prev: any) => ({ ...prev, error }));
  }

  protected setCreating(creating: boolean) {
    this.setState((prev: any) => ({ ...prev, isCreating: creating }));
  }

  protected async makeApiCall<T>(
    url: string,
    options: RequestInit = {},
    errorMessage: string = 'API call failed'
  ): Promise<T | null> {
    if (!this.token || !this.clientId) return null;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`Error: ${errorMessage}`, err);
      this.setError(err instanceof Error ? err.message : errorMessage);
      return null;
    }
  }

  public reset() {
    this.setState((prev: any) => ({
      ...prev,
      isLoading: false,
      error: null,
      isCreating: false,
    }));
  }
}
