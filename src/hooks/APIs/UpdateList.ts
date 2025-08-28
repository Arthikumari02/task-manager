import { useState } from 'react';
// Removed runInAction import
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
        listsStore.setLoading(true);
        listsStore.setError(null);

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
            
            // Update the list in the store
            listsStore.updateListProperty(listId, 'name', updatedList.name);
            listsStore.setLoading(false);

            if (options?.onSuccess) {
                options.onSuccess();
            }
            
            return true;
        } catch (error) {
            console.error('Error updating list:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update list';
            
            listsStore.setError(errorMessage);
            listsStore.setLoading(false);

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
