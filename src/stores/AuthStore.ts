import { makeAutoObservable, runInAction, action } from 'mobx';

interface Organization {
  id: string;
  name: string;
  displayName: string;
}

interface Board {
  id: string;
  name: string;
  desc: string;
  organizationId: string;
  closed: boolean;
  url?: string;
  prefs?: {
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  pos: number;
  idList: string;
  idBoard: string;
}

class AuthStore {
  token: string | null = null;
  clientId: string | null = null;
  organizations: Organization[] = [];
  currentOrganization: Organization | null = null;
  boards: Board[] = [];
  isLoadingBoards: boolean = false;
  boardsError: string | null = null;
  isCreatingBoard: boolean = false;
  isCreatingCard: boolean = false;
  isCreatingList: boolean = false;
  isSwitchingOrganization: boolean = false;
  
  // Board lists and cards state
  boardLists: { [boardId: string]: TrelloList[] } = {};
  boardCards: { [boardId: string]: TrelloCard[] } = {};
  isLoadingLists: boolean = false;
  listsError: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.clientId = process.env.REACT_APP_TRELLO_API_KEY || process.env.REACT_APP_TRELLO_CLIENT_ID || null;
    this.loadTokenFromStorage();
    this.initializeData();
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  get currentOrganizationBoards(): Board[] {
    if (!this.currentOrganization) return [];
    return this.boards.filter(board => 
      board.organizationId === this.currentOrganization!.id && !board.closed
    );
  }

  login = async (newToken: string) => {
    this.token = newToken;
    localStorage.setItem('trello_token', newToken);
    // Fetch user organizations and boards after login
    await this.fetchUserOrganizations();
  };

  logout = () => {
    this.token = null;
    this.currentOrganization = null;
    this.organizations = [];
    this.boards = [];
    this.boardLists = {};
    this.boardCards = {};
    this.boardsError = null;
    this.listsError = null;
    localStorage.removeItem('trello_token');
    // Clear all data after logout
    this.organizations = [];
    this.currentOrganization = null;
    this.boards = [];
  };

  setCurrentOrganization = action(async (organization: Organization) => {
    this.currentOrganization = organization;
    await this.fetchBoardsForOrganization(organization.id);
  });

  fetchBoardsForOrganization = async (organizationId: string) => {
    if (!this.token || !this.clientId) return;

    this.isLoadingBoards = true;
    this.boardsError = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/organizations/${organizationId}/boards?key=${this.clientId}&token=${this.token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.statusText}`);
      }

      const trelloBoards = await response.json();
      
      // Transform Trello boards to our format
      const fetchedBoards = trelloBoards.map((board: any) => ({
        id: board.id,
        name: board.name,
        desc: board.desc || '',
        organizationId: organizationId,
        closed: board.closed,
        url: board.url,
        prefs: board.prefs
      }));

      // Replace boards for this organization to avoid duplicates
      this.boards = [
        ...this.boards.filter(b => b.organizationId !== organizationId),
        ...fetchedBoards
      ];

    } catch (error) {
      console.error('Error fetching boards:', error);
      this.boardsError = error instanceof Error ? error.message : 'Failed to fetch boards';
      this.boards = [];
    } finally {
      this.isLoadingBoards = false;
    }
  };

  addBoard = async (name: string, description: string = ''): Promise<Board | null> => {
    if (!this.currentOrganization || !this.token || !this.clientId) return null;

    this.isCreatingBoard = true;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/?key=${this.clientId}&token=${this.token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            desc: description,
            idOrganization: this.currentOrganization.id,
            prefs_permissionLevel: 'org'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create board: ${response.statusText}`);
      }

      const newBoard = await response.json();
      
      // Create the board object to add to local state
      const boardToAdd: Board = {
        id: newBoard.id,
        name: newBoard.name,
        desc: newBoard.desc || '',
        organizationId: this.currentOrganization.id,
        closed: false,
        url: newBoard.url,
        prefs: newBoard.prefs
      };

      // Add the new board to our local state
      this.boards.push(boardToAdd);
      
      return boardToAdd;

    } catch (error) {
      console.error('Error creating board:', error);
      this.boardsError = error instanceof Error ? error.message : 'Failed to create board';
      return null;
    } finally {
      this.isCreatingBoard = false;
    }
  };

  // Fetch board lists from Trello API
  fetchBoardLists = async (boardId: string): Promise<TrelloList[]> => {
    if (!this.token || !this.clientId) return [];

    this.isLoadingLists = true;
    this.listsError = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${this.clientId}&token=${this.token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }

      const lists: TrelloList[] = await response.json();
      runInAction(() => {
        this.boardLists[boardId] = lists.filter(list => !list.closed);
      });
      
      return this.boardLists[boardId];
    } catch (error) {
      console.error('Error fetching board lists:', error);
      this.listsError = error instanceof Error ? error.message : 'Failed to fetch lists';
      return [];
    } finally {
      this.isLoadingLists = false;
    }
  };

  // Create a new list in a board
  createList = async (boardId: string, name: string): Promise<TrelloList | null> => {
    if (!this.token || !this.clientId) return null;

    this.isCreatingList = true;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            key: this.clientId,
            token: this.token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.statusText}`);
      }

      const newList: TrelloList = await response.json();
      
      // Add to local state using runInAction to avoid MobX strict mode error
      runInAction(() => {
        if (!this.boardLists[boardId]) {
          this.boardLists[boardId] = [];
        }
        this.boardLists[boardId].push(newList);
      });
      
      return newList;
    } catch (error) {
      console.error('Error creating list:', error);
      this.listsError = error instanceof Error ? error.message : 'Failed to create list';
      return null;
    } finally {
      this.isCreatingList = false;
    }
  };

  // Create a new card in a list
  createCard = async (listId: string, name: string): Promise<TrelloCard | null> => {
    if (!this.token || !this.clientId) return null;

    this.isCreatingCard = true;

    try {
      const response = await fetch(
        `https://api.trello.com/1/cards`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idList: listId,
            key: this.clientId,
            token: this.token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create card: ${response.statusText}`);
      }

      const newCard: TrelloCard = await response.json();
      
      // Add to local state using runInAction
      runInAction(() => {
        const boardId = newCard.idBoard;
        if (!this.boardCards[boardId]) {
          this.boardCards[boardId] = [];
        }
        this.boardCards[boardId].push(newCard);
      });
      
      return newCard;
    } catch (error) {
      console.error('Error creating card:', error);
      return null;
    } finally {
      this.isCreatingCard = false;
    }
  };

  // Fetch cards for a board
  fetchBoardCards = async (boardId: string): Promise<TrelloCard[]> => {
    if (!this.token || !this.clientId) return [];

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/cards?key=${this.clientId}&token=${this.token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const cards: TrelloCard[] = await response.json();
      runInAction(() => {
        this.boardCards[boardId] = cards.filter(card => !card.closed);
      });
      
      return this.boardCards[boardId];
    } catch (error) {
      console.error('Error fetching board cards:', error);
      return [];
    }
  };

  private loadTokenFromStorage = () => {
    const storedToken = localStorage.getItem('trello_token');
    if (storedToken) {
      this.token = storedToken;
    }
  };

  private initializeData = async () => {
    if (this.token && this.clientId) {
      // If we have a token, fetch real organizations and boards
      await this.fetchUserOrganizations();
    } else {
      // If no token, clear data
      this.organizations = [];
      this.currentOrganization = null;
      this.boards = [];
    }
  };

  fetchUserOrganizations = async () => {
    if (!this.token || !this.clientId) return;

    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me/organizations?key=${this.clientId}&token=${this.token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.statusText}`);
      }

      const trelloOrgs = await response.json();
      
      this.organizations = trelloOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName || org.name
      }));

      // Set first organization as default and fetch its boards
      if (this.organizations.length > 0) {
        this.currentOrganization = this.organizations[0];
        await this.fetchBoardsForOrganization(this.organizations[0].id);
      }

    } catch (error) {
      console.error('Error fetching organizations:', error);
      this.organizations = [];
      this.currentOrganization = null;
      this.boards = [];
    }
  };

}

export const authStore = new AuthStore();
