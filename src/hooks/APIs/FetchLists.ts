import { useState } from 'react';
import { ListModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useListsStore } from "../../contexts";

interface FetchListsOptions {
    onSuccess?: (lists: ListModel[]) => void;
    onError?: (error: string) => void;
}

export const useFetchLists = () => {
    const listsStore = useListsStore();
    const [isFetching, setIsFetching] = useState(false);

    const fetchLists = async (boardId: string, options?: FetchListsOptions): Promise<void> => {
        const { token, clientId } = getAuthData();

        if (!token || !clientId || !boardId) {
            return;
        }

        setIsFetching(true);
        listsStore.setLoading(true);
        listsStore.setError(null);

        
        try {
            const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${clientId}&token=${token}&filter=open`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch lists: ${response.statusText}`);
            }

            const trelloLists = await response.json();
            const listModelsToAdd: ListModel[] = [];
            // Clear existing lists for this board to ensure fresh data on page reload
            listsStore.clearListsForBoard(boardId);


            trelloLists.forEach((list: any) => {
                const listModel = new ListModel({
                    id: list.id,
                    name: list.name,
                    boardId: boardId,
                    closed: list.closed || false,
                    pos: list.pos || 0
                });

                listsStore.listsMap.set(listModel.id, listModel);
                listModelsToAdd.push(listModel);
            });

            if (options?.onSuccess) {
                options.onSuccess(listModelsToAdd);
            }

        } catch (err) {
            console.error('Error fetching lists:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lists';

            listsStore.setError(errorMessage);

            if (options?.onError) {
                options.onError(errorMessage);
            }
        } finally {
            setIsFetching(false);
            listsStore.setLoading(false);
        }
    };

    return { fetchLists, isFetching };
};
