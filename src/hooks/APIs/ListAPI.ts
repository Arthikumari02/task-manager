import { apiGet, apiPost, apiPut } from '../../utils/api';
import { TrelloList } from '../../types';

export const useListAPI = () => {
  /**
   * Fetches lists for a specific board
   * @param boardId The board ID to fetch lists for
   * @returns Array of TrelloList objects or null if error
   */
  const fetchLists = async (boardId: string): Promise<TrelloList[] | null> => {
    if (!boardId) {
      console.error('Missing boardId');
      return null;
    }

    const response = await apiGet<any[]>(`/boards/${boardId}/lists`);
    
    if (response.error || !response.data) {
      console.error('Failed to fetch lists:', response.error);
      return null;
    }

    return response.data.map((list: any) => ({
      id: list.id,
      name: list.name,
      boardId: list.idBoard,
      closed: list.closed || false,
      pos: list.pos || 0
    }));
  };

  /**
   * Creates a new list in the specified board
   * @param name The name of the new list
   * @param boardId The board ID to create the list in
   * @returns The created TrelloList or null if error
   */
  const createList = async (name: string, boardId: string): Promise<TrelloList | null> => {
    if (!boardId) return null;

    const response = await apiPost<any>('/lists', {
      name,
      idBoard: boardId
    });

    if (response.error || !response.data) {
      console.error('Error creating list:', response.error);
      return null;
    }

    const newList = response.data;
    
    return {
      id: newList.id,
      name: newList.name,
      boardId: newList.idBoard,
      closed: newList.closed || false,
      pos: newList.pos || 0
    };
  };

  /**
   * Updates a list's name
   * @param listId The ID of the list to update
   * @param newName The new name for the list
   * @returns Boolean indicating success or failure
   */
  const updateListName = async (listId: string, newName: string): Promise<boolean> => {
    const response = await apiPut(`/lists/${listId}`, { name: newName });
    
    if (response.error) {
      console.error('Error updating list name:', response.error);
      return false;
    }
    
    return true;
  };

  /**
   * Updates a list's position
   * @param listId The ID of the list to update
   * @param newPos The new position for the list
   * @returns Boolean indicating success or failure
   */
  const updateListPosition = async (listId: string, newPos: number): Promise<boolean> => {
    const response = await apiPut(`/lists/${listId}`, { pos: newPos });
    
    if (response.error) {
      console.error('Error updating list position:', response.error);
      return false;
    }
    
    return true;
  };

  return {
    fetchLists,
    createList,
    updateListName,
    updateListPosition
  };
};
