import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloList } from '../../types';
import { ListModel } from '../../models';

class ListStore {
  boardLists: { [boardId: string]: ListModel[] } = {};
  isLoading: boolean = false;
  error: string | null = null;
  isCreating: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  fetchLists = async (boardId: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !boardId) return;

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${clientId}&token=${token}&filter=open`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lists: ${response.statusText}`);
      }

      const trelloLists = await response.json();
      
      runInAction(() => {
        this.boardLists[boardId] = trelloLists
          .filter((list: any) => !list.closed)
          .map((list: any) => new ListModel({
            id: list.id,
            name: list.name,
            boardId: boardId,
            closed: list.closed || false,
            pos: list.pos || 0
          }));
      });

    } catch (err) {
      console.error('Error fetching lists:', err);
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch lists';
        this.boardLists[boardId] = [];
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  createList = async (boardId: string, name: string): Promise<ListModel | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId || !boardId) return null;

    this.isCreating = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/lists?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            idBoard: boardId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create list: ${response.statusText}`);
      }

      const newList = await response.json();
      
      const listToAdd = new ListModel({
        id: newList.id,
        name: newList.name,
        boardId: boardId,
        closed: false,
        pos: newList.pos || 0
      });

      runInAction(() => {
        if (!this.boardLists[boardId]) {
          this.boardLists[boardId] = [];
        }
        this.boardLists[boardId].push(listToAdd);
      });
      
      return listToAdd;

    } catch (error) {
      console.error('Error creating list:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create list';
      });
      return null;
    } finally {
      runInAction(() => {
        this.isCreating = false;
      });
    }
  };

  updateList = async (listId: string, newName: string): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    // Find the list model and use its updateName method
    let targetList: ListModel | null = null;
    Object.keys(this.boardLists).forEach(boardId => {
      const list = this.boardLists[boardId].find(list => list.id === listId);
      if (list) {
        targetList = list;
      }
    });

    if (targetList) {
      await (targetList as ListModel).updateName(newName, { token, clientId });
    }
  };

  reorderLists = async (boardId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
    if (!this.boardLists[boardId]) return;

    const lists = [...this.boardLists[boardId]];
    const [movedList] = lists.splice(sourceIndex, 1);
    lists.splice(destinationIndex, 0, movedList);

    // Update local state immediately for better UX
    runInAction(() => {
      this.boardLists[boardId] = lists;
    });

    // Update positions on server
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    try {
      await fetch(
        `https://api.trello.com/1/lists/${movedList.id}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pos: destinationIndex })
        }
      );
    } catch (error) {
      console.error('Error reordering lists:', error);
      // Revert on error
      await this.fetchLists(boardId);
    }
  };

  // Alias for compatibility with useBoardData hook
  fetchBoardLists = this.fetchLists;

  getListsForBoard = (boardId: string): ListModel[] => {
    return this.boardLists[boardId] || [];
  };

  reset = () => {
    this.boardLists = {};
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
  };
}

export default ListStore;
