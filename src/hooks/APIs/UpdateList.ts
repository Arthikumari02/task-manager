import { useState } from 'react';
import { runInAction } from 'mobx';
import { getAuthData } from "../../utils/auth";
import { useListsStore } from "../../contexts";

interface UpdateListOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useUpdateList = () => {
    const listsStore = useListsStore();
    const [isUpdating, setIsUpdating] = useState(false);

    const updateList = async (listId: string, newName: string, options?: UpdateListOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsUpdating(true);
        runInAction(() => {
            listsStore.isLoading = true;
            listsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/lists/${listId}?key=${clientId}&token=${token}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: newName })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update list: ${response.statusText}`);
            }

            const updatedList = await response.json();
            
            runInAction(() => {
                // Update the list in the store
                const list = listsStore.getListById(listId);
                if (list) {
                    list.name = updatedList.name;
                }
            });
            
            runInAction(() => {
                listsStore.isLoading = false;
            });

            if (options?.onSuccess) {
                options.onSuccess();
            }
            
            return true;
        } catch (error) {
            console.error('Error updating list:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update list';
            
            runInAction(() => {
                listsStore.error = errorMessage;
            });
            
            runInAction(() => {
                listsStore.isLoading = false;
            });

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsUpdating(false);
        }
    };

    return { updateList, isUpdating };
};
