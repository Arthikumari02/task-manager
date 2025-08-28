import { useState } from 'react';
// Removed runInAction import
import { getAuthData } from "../../utils/auth";
import { useBoardsStore } from "../../contexts";

interface UpdateBoardNameOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useUpdateBoardName = () => {
    const boardsStore = useBoardsStore();
    const [isUpdating, setIsUpdating] = useState(false);
    
    const updateBoardName = async (boardId: string, newName: string, options?: UpdateBoardNameOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsUpdating(true);
        boardsStore.setLoading(true);
        boardsStore.setError(null);

        try {
            const response = await fetch(
                `https://api.trello.com/1/boards/${boardId}?key=${clientId}&token=${token}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: newName })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update board name: ${response.statusText}`);
            }

            const updatedBoard = await response.json();

            // Update BoardModel
            boardsStore.updateBoardProperty(boardId, 'name', updatedBoard.name);
            boardsStore.setLoading(false);

            if (options?.onSuccess) {
                options.onSuccess();
            }

            return true;

        } catch (error) {
            console.error('Error updating board name:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update board name';
            
            boardsStore.setError(errorMessage);
            boardsStore.setLoading(false);
            
            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsUpdating(false);
        }
    };
    
    return { updateBoardName, isUpdating };
};
