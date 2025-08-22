import authStore from './auth/AuthStore';
import OrganizationStore from './organization/OrganizationStore';
import BoardStore from './board/BoardStore';
import ListStore from './list/ListStore';
import CardStore from './card/CardStore';

class StoreManager {
  public auth = authStore;
  public organization: OrganizationStore;
  public board: BoardStore;
  public list: ListStore;
  public card: CardStore;

  constructor() {
    // Create stores with auth data dependency injection
    const getAuthData = () => ({
      token: this.auth.token,
      clientId: this.auth.clientId
    });

    this.organization = new OrganizationStore(getAuthData);
    this.board = new BoardStore(getAuthData);
    this.list = new ListStore(getAuthData);
    this.card = new CardStore(getAuthData);

    // Initialize data when authentication changes
    this.setupAuthWatcher();
  }

  private setupAuthWatcher = () => {
    // Watch for authentication changes
    let wasAuthenticated = this.auth.isAuthenticated;
    
    setInterval(() => {
      const isNowAuthenticated = this.auth.isAuthenticated;
      
      if (!wasAuthenticated && isNowAuthenticated) {
        // User just logged in
        this.initializeData();
      } else if (wasAuthenticated && !isNowAuthenticated) {
        // User just logged out
        this.resetAllStores();
      }
      
      wasAuthenticated = isNowAuthenticated;
    }, 100); // Check every 100ms
  };

  private initializeData = async () => {
    try {
      await this.organization.fetchOrganizations();
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  };

  private resetAllStores = () => {
    this.organization.reset();
    this.board.reset();
    this.list.reset();
    this.card.reset();
  };

  // Convenience methods for common operations
  switchOrganization = async (organizationId: string) => {
    const org = this.organization.organizations.find(o => o.id === organizationId);
    if (org) {
      this.organization.setCurrentOrganization(org);
      // Reset board-related data when switching organizations
      this.board.reset();
      this.list.reset();
      this.card.reset();
      // Fetch boards for new organization
      await this.board.fetchBoards(organizationId);
    }
  };

  loadBoardData = async (boardId: string) => {
    await Promise.all([
      this.list.fetchLists(boardId),
      this.card.fetchCards(boardId)
    ]);
  };
}

export const storeManager = new StoreManager();
