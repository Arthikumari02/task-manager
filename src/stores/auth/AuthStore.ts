import { makeAutoObservable, runInAction } from 'mobx';

interface UserInfo {
  id: string;
  fullName: string;
  initials: string;
  email: string;
  username: string;
}

class AuthStore {
    token: string | null = null;
    clientId: string | null = null;
    userInfo: UserInfo | null = null;
    isLoadingUserInfo: boolean = false;

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
        // Also store clientId if not already stored
        if (this.clientId) {
            localStorage.setItem('trello_clientId', this.clientId);
        }
    };

    logout = () => {
        this.token = null;
        this.userInfo = null;
        localStorage.removeItem('trello_token');
    };

    fetchUserInfo = async (): Promise<void> => {
        if (!this.token || !this.clientId) return;

        this.isLoadingUserInfo = true;
        try {
            const response = await fetch(
                `https://api.trello.com/1/members/me?key=${this.clientId}&token=${this.token}&fields=id,fullName,initials,email,username`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }

            const userData = await response.json();
            
            runInAction(() => {
                this.userInfo = {
                    id: userData.id,
                    fullName: userData.fullName,
                    initials: userData.initials,
                    email: userData.email,
                    username: userData.username
                };
            });
        } catch (error) {
            console.error('Error fetching user info:', error);
        } finally {
            runInAction(() => {
                this.isLoadingUserInfo = false;
            });
        }
    };

    private loadTokenFromStorage = () => {
        const storedToken = localStorage.getItem('trello_token');
        if (storedToken) {
            this.token = storedToken;
        }
    };
}

const authStore = new AuthStore();
export default authStore;
export { AuthStore };
