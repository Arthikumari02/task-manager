import { apiGet, apiPost, apiPut } from '../../utils/api';
import { CardModel } from '../../models';
import { TrelloCard } from '../../types';

export const useCardAPI = () => {
  const fetchBoardCards = async (boardId: string): Promise<TrelloCard[]> => {
    const response = await apiGet<any[]>(`/boards/${boardId}/cards?filter=open`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch cards');
    }
    
    return response.data.map((card: any) => ({
      id: card.id,
      name: card.name,
      desc: card.desc || '',
      closed: card.closed || false,
      pos: card.pos || 0,
      listId: card.idList,
      boardId: boardId,
      url: card.url || ''
    }));
  };

  const createCard = async (name: string, listId: string): Promise<TrelloCard> => {
    const response = await apiPost<{
      id: string;
      name: string;
      desc?: string;
      idList: string;
      idBoard: string;
      closed?: boolean;
      pos?: number;
      url?: string;
    }>('/cards', {
      name,
      idList: listId
    });
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create card');
    }
    
    const newCard = response.data;
    return {
      id: newCard.id,
      name: newCard.name,
      desc: newCard.desc || '',
      listId: newCard.idList,
      boardId: newCard.idBoard,
      closed: false,
      pos: newCard.pos || 0,
      url: newCard.url || ''
    };
  };

  const updateCardName = async (cardId: string, newName: string): Promise<boolean> => {
    const response = await apiPut(`/cards/${cardId}`, { name: newName });
    return response.error === null;
  };

  const moveCardToList = async (cardId: string, newListId: string): Promise<boolean> => {
    const response = await apiPut(`/cards/${cardId}`, { idList: newListId });
    return response.error === null;
  };

  const updateCardPosition = async (cardId: string, newPos: number | string): Promise<boolean> => {
    const response = await apiPut(`/cards/${cardId}`, { pos: newPos });
    return response.error === null;
  };

  const updateCardDescription = async (cardId: string, newDesc: string): Promise<boolean> => {
    const response = await apiPut(`/cards/${cardId}`, { desc: newDesc });
    return response.error === null;
  };

  const deleteCard = async (cardId: string): Promise<boolean> => {
    // In Trello, cards are not actually deleted but closed (archived)
    const response = await apiPut(`/cards/${cardId}`, { closed: true });
    return response.error === null;
  };

  const addComment = async (cardId: string, comment: string): Promise<boolean> => {
    const response = await apiPost(`/cards/${cardId}/actions/comments`, { text: comment });
    return response.error === null;
  };

  return {
    fetchBoardCards,
    createCard,
    updateCardName,
    moveCardToList,
    updateCardPosition,
    updateCardDescription,
    deleteCard,
    addComment
  };
};
