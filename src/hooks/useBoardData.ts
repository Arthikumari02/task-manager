import { useState, useEffect } from 'react';
import { useAuth, useBoards, useLists, useCards, useOrganizations } from '../contexts';
import { UseBoardDataReturn, TrelloCard } from '../types';
import { ListModel } from '../models';

export const useBoardData = (boardId: string | undefined): UseBoardDataReturn => {
  const { token, clientId } = useAuth();
  const { boards } = useBoards();
  const { fetchBoardLists, getListsMap, getListsForBoard, clearListsForBoard } = useLists();
  const { fetchBoardCards, getCardsByListMap, getCardsForBoard } = useCards();
  const { organizations, fetchOrganizations } = useOrganizations();

  const [boardName, setBoardName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Use enhanced store methods for efficient Map-based lookups
  const lists: ListModel[] = boardId ? getListsForBoard(boardId) : [];
  const cards: TrelloCard[] = boardId ? getCardsForBoard(boardId) : [];

  // Use store methods for efficient Map-based lookups
  const listsMap = boardId ? getListsMap(boardId) : new Map();
  const cardsByListMap = boardId ? getCardsByListMap(boardId) : new Map();

  // Sort lists by position (create new array to avoid MobX mutation error)
  const sortedLists = hasInitialLoad ? lists.slice().sort((a, b) => (a.pos || 0) - (b.pos || 0)) : [];

  useEffect(() => {
    if (!boardId) {
      setIsLoading(false);
      return;
    }

    const fetchBoardData = async () => {
      setIsLoading(true);
      console.log('useBoardData: Starting fetchBoardData for boardId:', boardId);

      try {
        // First ensure we have organizations and boards data
        if (organizations.length === 0) {
          console.log('useBoardData: Fetching organizations...');
          await fetchOrganizations();
        }

        // Now try to find the board name
        const board = boards.find(b => b.id === boardId);
        if (board) {
          setBoardName(board.name);
          console.log('useBoardData: Found board name:', board.name);
        } else {
          // If board is still not found, try to fetch it directly from Trello API
          console.log('useBoardData: Board not found in store, fetching from API...');
          try {
            const response = await fetch(
              `https://api.trello.com/1/boards/${boardId}?key=${clientId}&token=${token}`
            );
            if (response.ok) {
              const boardData = await response.json();
              setBoardName(boardData.name);
              console.log('useBoardData: Fetched board name from API:', boardData.name);
            } else {
              setBoardName('Board');
              console.log('useBoardData: Failed to fetch board, using default name');
            }
          } catch (error) {
            console.error('Error fetching board details:', error);
            setBoardName('Board');
          }
        }

        // Clear existing lists for this board to avoid stale data
        clearListsForBoard(boardId);

        // Fetch lists and cards for the board
        console.log('useBoardData: Fetching lists and cards...');
        await Promise.all([
          fetchBoardLists(boardId, (fetchedLists) => {
            console.log('useBoardData: fetchBoardLists callback called with:', fetchedLists.length, 'lists');
          }),
          fetchBoardCards(boardId)
        ]);

        console.log('useBoardData: Finished fetching board data');
        setHasInitialLoad(true);

      } catch (error) {
        console.error('Error fetching board data:', error);
        setHasInitialLoad(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, []);

  const handleTaskAdded = async () => {
    if (!boardId) return;

    try {
      // Set loading state
      setIsLoading(true);

      // Clear any existing data first
      clearListsForBoard(boardId);

      // Fetch fresh data
      await Promise.all([
        fetchBoardLists(boardId, (fetchedLists) => {
          console.log('Refreshed lists after task addition:', fetchedLists.length);
        }),
        fetchBoardCards(boardId)
      ]);

      // Ensure we have the latest data
      setHasInitialLoad(true);
    } catch (error) {
      console.error('Error refreshing board data after task addition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show content when we've completed the initial load
  const showContent = hasInitialLoad && !isLoading;

  return {
    boardName,
    lists: showContent ? sortedLists : [],
    cards: showContent ? cards : [],
    isLoading,
    handleTaskAdded,
    // Expose hierarchy maps for efficient component access
    listsMap: showContent ? listsMap : new Map(),
    cardsByListMap: showContent ? cardsByListMap : new Map(),
  };
};
