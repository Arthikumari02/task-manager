import { apiGet, apiPost, apiPut } from '../../utils/api';
import { TrelloBoard } from '../../types';

export const useBoardAPI = () => {
  const fetchBoards = async (organizationId: string): Promise<TrelloBoard[] | null> => {
    if (!organizationId) {
      console.error('Missing organizationId');
      return null;
    }

    const response = await apiGet<any[]>(`/organizations/${organizationId}/boards?filter=open`);

    if (response.error || !response.data) {
      console.error('Failed to fetch boards:', response.error);
      return null;
    }

    return response.data.map((board: any) => ({
      id: board.id,
      name: board.name,
      desc: board.desc || '',
      organizationId: organizationId,
      closed: board.closed || false,
      url: board.url || '',
      prefs: board.prefs || {}
    }));
  };

  const createBoard = async (name: string, organizationId: string): Promise<TrelloBoard | null> => {
    if (!organizationId) return null;

    const response = await apiPost<any>('/boards', {
      name,
      idOrganization: organizationId,
      prefs_permissionLevel: 'org'
    });

    if (response.error || !response.data) {
      console.error('Error creating board:', response.error);
      return null;
    }

    const newBoard = response.data;

    return {
      id: newBoard.id,
      name: newBoard.name,
      desc: newBoard.desc || '',
      organizationId: organizationId,
      closed: false,
      url: newBoard.url,
      shortUrl: newBoard.shortUrl,
      prefs: newBoard.prefs || {}
    };
  };

  const updateBoardName = async (boardId: string, newName: string): Promise<boolean> => {
    const response = await apiPut(`/boards/${boardId}`, { name: newName });

    if (response.error) {
      console.error('Error updating board name:', response.error);
      return false;
    }

    return true;
  };

  return {
    fetchBoards,
    createBoard,
    updateBoardName
  };
};
