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
        // Fetch user info immediately after login
        this.fetchUserInfo();
    };

    logout = () => {
        this.token = null;
        this.userInfo = null;
        localStorage.removeItem('trello_token');
        // Also remove stored user info
        localStorage.removeItem('trello_userInfo');
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

            const userInfo = {
                id: userData.id,
                fullName: userData.fullName,
                initials: userData.initials,
                email: userData.email,
                username: userData.username
            };

            runInAction(() => {
                this.userInfo = userInfo;
            });

            // Store user info in localStorage for persistence
            localStorage.setItem('trello_userInfo', JSON.stringify(userInfo));
        } catch (error) {
            console.error('Error fetching user info:', error);
            // If fetch fails, try to load from localStorage
            this.loadUserInfoFromStorage();
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
            // Load user info from storage first (for immediate display)
            this.loadUserInfoFromStorage();
            // Then fetch fresh user info from API
            this.fetchUserInfo();
        }
    };

    private loadUserInfoFromStorage = () => {
        const storedUserInfo = localStorage.getItem('trello_userInfo');
        if (storedUserInfo) {
            try {
                this.userInfo = JSON.parse(storedUserInfo);
            } catch (error) {
                console.error('Error parsing stored user info:', error);
            }
        }
    };
}

const authStore = new AuthStore();
export default authStore;
export { AuthStore };