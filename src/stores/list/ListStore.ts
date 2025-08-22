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
          }))
          .sort((a: ListModel, b: ListModel) => a.pos - b.pos); // Sort by position
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
        // Sort after adding
        this.boardLists[boardId].sort((a, b) => a.pos - b.pos);
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
    console.log('Reordering lists:', { boardId, sourceIndex, destinationIndex });

    if (!this.boardLists[boardId] || sourceIndex === destinationIndex) {
      console.log('No lists found or same position, aborting');
      return;
    }

    const lists = [...this.boardLists[boardId]];
    const [movedList] = lists.splice(sourceIndex, 1);
    lists.splice(destinationIndex, 0, movedList);

    // Update local state immediately for better UX
    runInAction(() => {
      this.boardLists[boardId] = lists;
    });

    // Calculate new position for Trello API
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) {
      console.log('No auth data available');
      return;
    }

    try {
      let newPos: number | string;

      if (destinationIndex === 0) {
        // Moving to the beginning
        newPos = 'top';
      } else if (destinationIndex === lists.length - 1) {
        // Moving to the end
        newPos = 'bottom';
      } else {
        // Moving to middle - calculate position between adjacent lists
        const prevList = lists[destinationIndex - 1];
        const nextList = lists[destinationIndex + 1];
        newPos = (prevList.pos + nextList.pos) / 2;
      }

      console.log('Updating list position:', { listId: movedList.id, newPos });

      const response = await fetch(
        `https://api.trello.com/1/lists/${movedList.id}?key=${clientId}&token=${token}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pos: newPos })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update list position: ${response.statusText}`);
      }

      const updatedList = await response.json();

      // Update the list's position with the actual value returned from Trello
      runInAction(() => {
        const listIndex = this.boardLists[boardId].findIndex(list => list.id === movedList.id);
        if (listIndex !== -1) {
          this.boardLists[boardId][listIndex].pos = updatedList.pos;
        }
        // Re-sort to ensure correct order
        this.boardLists[boardId].sort((a, b) => a.pos - b.pos);
      });

    } catch (error) {
      console.error('Error reordering lists:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to reorder lists';
      });
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