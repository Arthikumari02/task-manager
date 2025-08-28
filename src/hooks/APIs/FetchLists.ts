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

        // Check if we've fetched this board recently
        const now = Date.now();
        const lastFetch = listsStore.lastFetchTimes.get(boardId) || 0;
        const isPageReload = !document.referrer || document.referrer.includes('login');

        // Skip fetch only if it's not a page reload and we've fetched recently
        if (!isPageReload && now - lastFetch < listsStore.fetchDebounceMs) {
            // Return existing data instead of fetching again
            const existingLists = listsStore.getListsForBoard(boardId);
            if (existingLists.length > 0 && options?.onSuccess) {
                options.onSuccess(existingLists);
                return;
            }
        }

        setIsFetching(true);
        // Update last fetch time
        listsStore.lastFetchTimes.set(boardId, now);
        listsStore.setLoading(true);
        listsStore.setError(null);

        // Clear existing lists for this board to ensure fresh data on page reload
        listsStore.clearListsForBoard(boardId);

        try {
            const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${clientId}&token=${token}&filter=open`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch lists: ${response.statusText}`);
            }

            const trelloLists = await response.json();
            const listModelsToAdd: ListModel[] = [];

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
