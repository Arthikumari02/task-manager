import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useListsStore } from "../../contexts";

export const useCloseList = () => {
    const listsStore = useListsStore();
    
    const closeList = async (listId: string): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

    try {
        const response = await fetch(
            `https://api.trello.com/1/lists/${listId}?key=${clientId}&token=${token}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ closed: true })
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to close list: ${response.statusText}`);
        }

        // Mark the list as closed in local state instead of removing it
        runInAction(() => {
            const list = listsStore.getListById(listId);
            if (list) {
                list.closed = true;
            }
        });
        return true;

    } catch (error) {
        console.error('Error closing list:', error);
        runInAction(() => {
            listsStore.error = error instanceof Error ? error.message : 'Failed to close list';
        });
        return false;
    }
    };
    
    return { closeList };
};
