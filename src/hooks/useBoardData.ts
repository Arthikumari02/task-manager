import { useState, useEffect } from 'react';
import { useAuth, useBoards, useLists, useCards, useOrganizations } from '../contexts';
import { UseBoardDataReturn, TrelloCard } from '../types';
import { ListModel } from '../models';

export const useBoardData = (boardId: string | undefined): UseBoardDataReturn => {
  const { token, clientId } = useAuth();
  const { boards } = useBoards();
  const { fetchBoardLists, getListsMap, getListsForBoard } = useLists();
  const { fetchBoardCards, getCardsByListMap, getCardsForBoard } = useCards();
  const { organizations, fetchOrganizations } = useOrganizations();
  
  const [boardName, setBoardName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Use enhanced store methods for efficient Map-based lookups
  const lists: ListModel[] = boardId ? getListsForBoard(boardId) : [];
  const cards: TrelloCard[] = boardId ? getCardsForBoard(boardId) : [];
  
  // Use store methods for efficient Map-based lookups
  const listsMap = boardId ? getListsMap(boardId) : new Map();
  const cardsByListMap = boardId ? getCardsByListMap(boardId) : new Map();
  
  // Sort lists by position (create new array to avoid MobX mutation error)
  const sortedLists = lists.slice().sort((a, b) => (a.pos || 0) - (b.pos || 0));

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setIsLoading(true);
      try {
        // First ensure we have organizations and boards data
        if (organizations.length === 0) {
          await fetchOrganizations();
        }

        // Now try to find the board name
        const board = boards.find(b => b.id === boardId);
        if (board) {
          setBoardName(board.name);
        } else {
          // If board is still not found, try to fetch it directly from Trello API
          try {
            const response = await fetch(
              `https://api.trello.com/1/boards/${boardId}?key=${clientId}&token=${token}`
            );
            if (response.ok) {
              const boardData = await response.json();
              setBoardName(boardData.name);
            } else {
              setBoardName('Board');
            }
          } catch (error) {
            console.error('Error fetching board details:', error);
            setBoardName('Board');
          }
        }

        // Fetch lists and cards for the board
        await Promise.all([
          fetchBoardLists(boardId, () => {}),
          fetchBoardCards(boardId)
        ]);
        
      } catch (error) {
        console.error('Error fetching board data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, boards, organizations, fetchOrganizations, fetchBoardLists, fetchBoardCards, token, clientId]);

  const handleTaskAdded = () => {
    if (!boardId) return;
    // Refetch cards to get the latest data
    fetchBoardCards(boardId);
  };

  return {
    boardName,
    lists: sortedLists,
    cards,
    isLoading,
    handleTaskAdded,
    // Expose hierarchy maps for efficient component access
    listsMap,
    cardsByListMap,
  };
};
