import { BaseStore } from './BaseStore';
import { TrelloList } from '../types';

export interface ListStoreState {
  boardLists: { [boardId: string]: TrelloList[] };
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
}

export class ListStore extends BaseStore {
  constructor(setState: (updater: (prev: ListStoreState) => ListStoreState) => void, token: string | null, clientId: string | null) {
    super(setState, token, clientId);
  }

  async fetchBoardLists(boardId: string): Promise<TrelloList[]> {
    if (!this.token || !this.clientId) return [];

    this.setLoading(true);
    this.setError(null);

    const apiLists = await this.makeApiCall<any[]>(
      `https://api.trello.com/1/boards/${boardId}/lists?key=${this.clientId}&token=${this.token}`,
      {},
      'Failed to fetch lists'
    );

    if (apiLists) {
      const filteredLists: TrelloList[] = apiLists
        .filter((list: any) => !list.closed)
        .map((list: any) => ({
          id: list.id,
          name: list.name,
          closed: list.closed,
          pos: list.pos,
          boardId: boardId
        }));
      
      this.setState((prev: ListStoreState) => ({
        ...prev,
        boardLists: {
          ...prev.boardLists,
          [boardId]: filteredLists
        }
      }));
      
      this.setLoading(false);
      return filteredLists;
    }

    this.setLoading(false);
    return [];
  }

  async createList(boardId: string, name: string): Promise<TrelloList | null> {
    if (!this.token || !this.clientId) return null;

    this.setCreating(true);

    const apiList = await this.makeApiCall<any>(
      `https://api.trello.com/1/boards/${boardId}/lists`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          key: this.clientId,
          token: this.token
        })
      },
      'Failed to create list'
    );

    if (apiList) {
      const newList: TrelloList = {
        id: apiList.id,
        name: apiList.name,
        closed: apiList.closed,
        pos: apiList.pos,
        boardId: boardId
      };
      
      this.setState((prev: ListStoreState) => ({
        ...prev,
        boardLists: {
          ...prev.boardLists,
          [boardId]: [...(prev.boardLists[boardId] || []), newList]
        }
      }));
      
      this.setCreating(false);
      return newList;
    }

    this.setCreating(false);
    return null;
  }

  async updateList(listId: string, name: string): Promise<boolean> {
    if (!this.token || !this.clientId) return false;

    const response = await this.makeApiCall<any>(
      `https://api.trello.com/1/lists/${listId}?key=${this.clientId}&token=${this.token}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name })
      },
      'Failed to update list'
    );

    if (response) {
      // Update local state
      this.setState((prev: ListStoreState) => {
        const updatedBoardLists = { ...prev.boardLists };
        
        // Find and update the list in the appropriate board
        Object.keys(updatedBoardLists).forEach(boardId => {
          const listIndex = updatedBoardLists[boardId].findIndex(list => list.id === listId);
          if (listIndex !== -1) {
            updatedBoardLists[boardId] = [
              ...updatedBoardLists[boardId].slice(0, listIndex),
              { ...updatedBoardLists[boardId][listIndex], name },
              ...updatedBoardLists[boardId].slice(listIndex + 1)
            ];
          }
        });
        
        return { ...prev, boardLists: updatedBoardLists };
      });
      
      return true;
    }

    return false;
  }

  reorderLists(boardId: string, sourceIndex: number, destinationIndex: number): void {
    this.setState((prev: ListStoreState) => {
      const lists = [...(prev.boardLists[boardId] || [])];
      const [removed] = lists.splice(sourceIndex, 1);
      lists.splice(destinationIndex, 0, removed);
      
      return {
        ...prev,
        boardLists: {
          ...prev.boardLists,
          [boardId]: lists
        }
      };
    });
  }

  reset(): void {
    super.reset();
    this.setState((prev: ListStoreState) => ({
      ...prev,
      boardLists: {}
    }));
  }
}
