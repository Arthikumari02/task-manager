import { makeAutoObservable } from 'mobx';

class AuthStore {
  token: string | null = null;
  clientId: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.clientId = process.env.REACT_APP_TRELLO_API_KEY || process.env.REACT_APP_TRELLO_CLIENT_ID || null;
    this.loadTokenFromStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  login = (newToken: string) => {
    this.token = newToken;
    localStorage.setItem('trello_token', newToken);
  };

  logout = () => {
    this.token = null;
    localStorage.removeItem('trello_token');
  };

  private loadTokenFromStorage = () => {
    const storedToken = localStorage.getItem('trello_token');
    if (storedToken) {
      this.token = storedToken;
    }
  };
}

export const authStore = new AuthStore();
