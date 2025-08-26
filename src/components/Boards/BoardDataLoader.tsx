import React, { useState, useCallback, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useListsStore, useCardsStore, useBoardsStore } from '../../contexts';
import { useFetchLists } from '../../hooks/APIs/FetchLists';
import { useFetchCards } from '../../hooks/APIs/FetchCards';
import { BoardModel } from '../../models';

interface BoardDataLoaderProps {
  boardId: string;
  onDataLoaded: (isLoaded: boolean) => void;
  children: React.ReactNode;
}

/**
 * Component responsible for loading board data (lists and cards)
 */
const BoardDataLoader: React.FC<BoardDataLoaderProps> = observer(({
  boardId,
  onDataLoaded,
  children
}) => {
  const listStore = useListsStore();
  const cardStore = useCardsStore();
  const { getBoardById } = useBoardsStore();
  const fetchLists = useFetchLists();
  const fetchCards = useFetchCards();

  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadedForBoard, setDataLoadedForBoard] = useState<string | null>(null);

  const boardModel = getBoardById(boardId);

  const loadBoardData = useCallback(async () => {
    let isMounted = true;

    if (!boardId) return;

    if (dataLoadedForBoard === boardId) {
      setIsLoading(false);
      onDataLoaded(true);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch lists using the API hook
      await new Promise<void>((resolve) => {
        fetchLists.fetchLists(boardId, {
          onSuccess: (lists) => {
            if (!isMounted) return;
            if (boardModel) {
              lists.forEach(list => boardModel.addListId(list.id));
            }
            resolve();
          },
          onError: (error) => {
            console.error('Error fetching lists:', error);
            resolve();
          }
        });
      });

      // Get all lists for the board
      const lists = listStore.getListsForBoard(boardId);

      // Fetch cards for each list using the API hook
      for (const list of lists) {
        await new Promise<void>((resolve) => {
          fetchCards.fetchCards(list.id, boardId, {
            onSuccess: (cards) => {
              if (!isMounted) return;
              cards.forEach(card => {
                const listModel = listStore.getListById(card.listId);
                if (listModel) {
                  listModel.addCardId(card.id);
                }
              });
              resolve();
            },
            onError: (error) => {
              console.error('Error fetching cards:', error);
              resolve();
            }
          });
        });
      }

      if (isMounted) {
        setDataLoadedForBoard(boardId);
        setIsLoading(false);
        onDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading board data:', error);
      if (isMounted) {
        setIsLoading(false);
        onDataLoaded(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [boardId, boardModel, dataLoadedForBoard, listStore, onDataLoaded, fetchLists, fetchCards]);

  // Load data when boardId changes
  useEffect(() => {
    loadBoardData();
  }, [boardId, loadBoardData]);

  // Reset data loaded state when boardId changes
  useEffect(() => {
    if (dataLoadedForBoard && dataLoadedForBoard !== boardId) {
      setDataLoadedForBoard(null);
    }
  }, [boardId, dataLoadedForBoard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading board data...</div>
      </div>
    );
  }

  return <>{children}</>;
});

export default BoardDataLoader;
