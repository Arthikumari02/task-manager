import { useState, useEffect, useMemo } from 'react';
import { useAuth, useBoards, useLists, useCards, useOrganizations } from '../contexts';
import { UseBoardDataReturn, TrelloCard } from '../types';
import { BoardModel, CardModel, ListModel } from '../models';

export const useBoardData = (boardId: string): UseBoardDataReturn => {
  const { token, clientId } = useAuth();
  const { boards, getBoardById, addBoardModel, hasBoard } = useBoards();
  const { fetchBoardLists, getListsMap, getListsForBoard, clearListsForBoard, getListById } = useLists();
  const { fetchBoardCards, getCardsByListMap, getCardsForBoard } = useCards();
  const { organizations, fetchOrganizations } = useOrganizations();

  const [boardName, setBoardName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);


  // Use enhanced store methods for efficient Map-based lookups
  const lists: ListModel[] = boardId ? getListsForBoard(boardId) : [];
  const cards: TrelloCard[] = boardId ? getCardsForBoard(boardId) : [];
  const boardModel = getBoardById(boardId);

  // Use store methods for efficient Map-based lookups
  const listsMap = boardId ? getListsMap(boardId) : new Map();
  const cardsByListMap = boardId ? getCardsByListMap(boardId) : new Map();

  // Sort lists by position (create new array to avoid MobX mutation error)
  const sortedLists = hasInitialLoad ? lists.slice().sort((a, b) => (a.pos || 0) - (b.pos || 0)) : [];
  // Update list models with card IDs and ensure board model has all list IDs
  const onSuccessFetchCards = (cards: CardModel[]) => {
    cards.forEach((card) => {
      const list = getListById(card.listId);
      if (list) {
        list.addCardId(card.id);

        // Make sure the board model knows about this list
        if (boardModel && boardModel instanceof BoardModel) {
          if (!boardModel.hasListId(card.listId)) {
            boardModel.addListId(card.listId);
          }
        }
      }
    });
  }
  // Track if we've already loaded data for this board to prevent redundant fetches
  const [loadedBoardIds, setLoadedBoardIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!boardId) {
      setIsLoading(false);
      return;
    }

    // Always load lists and cards when a board is selected
    // We'll still check for existing data to avoid unnecessary API calls
    const hasExistingLists = getListsForBoard(boardId).length > 0;
    const hasExistingCards = getCardsForBoard(boardId).length > 0;
    // Remove the loadedBoardIds check to ensure we always refresh data
    const isAlreadyLoaded = false;

    if (isAlreadyLoaded) {
      setIsLoading(false);
      setHasInitialLoad(true);
      return;
    }

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
              addBoardModel(new BoardModel(boardData));
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

        // Only clear and fetch if we don't have data already
        if (!hasExistingLists) {
          // Clear existing lists for this board to avoid stale data
          // clearListsForBoard(boardId);

          // Fetch lists for the board
          await fetchBoardLists(boardId, (fetchedLists) => {
            fetchedLists.forEach((list) => {
              boardModel?.addListId(list.id);
            });
          });
        } else {
          console.log(`useBoardData: Using ${getListsForBoard(boardId).length} existing lists for board ${boardId}`);
        }

        // Only fetch cards if we don't have them already
        if (!hasExistingCards) {
          await fetchBoardCards(boardId, onSuccessFetchCards);
        } else {
          console.log(`useBoardData: Using ${getCardsForBoard(boardId).length} existing cards for board ${boardId}`);
        }

        setHasInitialLoad(true);

        // Mark this board as loaded
        setLoadedBoardIds(prev => {
          const newSet = new Set(prev);
          newSet.add(boardId);
          return newSet;
        });

      } catch (error) {
        console.error('Error fetching board data:', error);
        setHasInitialLoad(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, token, clientId]);

  const handleTaskAdded = async () => {
    if (!boardId) return;

    try {
      // Force a quick UI refresh
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setHasInitialLoad(true);
      }, 100);
    } catch (error) {
      console.error('Error refreshing board data after task addition:', error);
      setIsLoading(false);
    }
  };

  const showContent = hasInitialLoad && !isLoading;


  return {
    boardName,
    boardModel,
    lists: showContent ? sortedLists : [],
    cards: showContent ? cards : [],
    isLoading,
    handleTaskAdded,
    listsMap: showContent ? listsMap : new Map(),
    cardsByListMap: showContent ? cardsByListMap : new Map(),
  };
};
