import { runInAction } from "mobx";
import { ListModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useListsStore } from "../../contexts";

export const useCreateList = () => {
    const listsStore = useListsStore();
    
    const createList = async (boardId: string, name: string, onSuccess?: (listModel: ListModel) => void): Promise<ListModel | null> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId || !boardId) return null;

        runInAction(() => {
            listsStore.isCreating = true;
            listsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/lists?key=${clientId}&token=${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        idBoard: boardId,
                        pos: 'bottom' // Add position parameter to place the list at the end
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create list: ${response.statusText}`);
            }

            const newList = await response.json();

            const listModel = new ListModel({
                id: newList.id,
                name: newList.name,
                boardId: boardId,
                closed: false,
                pos: newList.pos || 0
            });

            runInAction(() => {
                listsStore.listsMap.set(listModel.id, listModel);
            });

            // Notify callback if provided
            if (onSuccess) {
                onSuccess(listModel);
            }

            return listModel;

        } catch (error) {
            console.error('Error creating list:', error);
            runInAction(() => {
                listsStore.error = error instanceof Error ? error.message : 'Failed to create list';
            });
            return null;
        } finally {
            runInAction(() => {
                listsStore.isCreating = false;
            });
        }
    };
    
    return { createList, isCreating: listsStore.isCreating };
};
