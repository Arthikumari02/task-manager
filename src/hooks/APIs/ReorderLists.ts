// Removed runInAction import
import { getAuthData } from "../../utils/auth";
import { useListsStore } from "../../contexts";
import { useFetchLists } from './FetchLists'

export const useReorderLists = () => {
    const listsStore = useListsStore();
    const fetchLists = useFetchLists();

    const reorderLists = async (boardId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
        const lists = listsStore.getListsForBoard(boardId).slice();

        if (lists.length === 0 || sourceIndex === destinationIndex) {
            return;
        }

        const [movedList] = lists.splice(sourceIndex, 1);
        lists.splice(destinationIndex, 0, movedList);

        // Update local order: adjust pos hints immediately
        lists.forEach((list: { pos: number }) => {
            list.pos = list.pos ?? 0;
        });
        listsStore.updateListPositions(lists);

        // Calculate new position for Trello API
        const { token, clientId } = getAuthData();
        if (!token || !clientId) {
            return;
        }

        try {
            let newPos: number | string;

            if (destinationIndex === 0) {
                newPos = 'top';
            } else if (destinationIndex === lists.length - 1) {
                newPos = 'bottom';
            } else {
                const prevList = lists[destinationIndex - 1];
                const nextList = lists[destinationIndex + 1];
                newPos = (prevList.pos + nextList.pos) / 2;
            }

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
            listsStore.updateListProperty(movedList.id, 'pos', updatedList.pos);

        } catch (error) {
            console.error('Error reordering lists:', error);
            listsStore.setError(error instanceof Error ? error.message : 'Failed to reorder lists');
            // Re-fetch to restore - use the hook function directly
            await fetchLists.fetchLists(boardId, {
                onSuccess: () => { }
            });
        }
    };

    return reorderLists;
};
