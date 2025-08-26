import { runInAction } from "mobx";
import { BoardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useBoardsStore } from "../../contexts";

export const useCreateBoard = () => {
    const boardsStore = useBoardsStore();
    
    const createBoard = async (name: string, organizationId: string): Promise<BoardModel | null> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId || !organizationId) return null;

        runInAction(() => {
            boardsStore.isCreating = true;
            boardsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/boards?key=${clientId}&token=${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        idOrganization: organizationId,
                        prefs_permissionLevel: 'org'
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create board: ${response.statusText}`);
            }

            const newBoard = await response.json();

            const boardData = {
                id: newBoard.id,
                name: newBoard.name,
                desc: newBoard.desc || '',
                organizationId: organizationId,
                closed: false,
                url: newBoard.url
            };

            // Create BoardModel instance
            const boardModel = new BoardModel(boardData);
            
            runInAction(() => {
                boardsStore.addBoardModel(boardModel);
            });

            return boardModel;

        } catch (error) {
            console.error('Error creating board:', error);
            runInAction(() => {
                boardsStore.error = error instanceof Error ? error.message : 'Failed to create board';
            });
            return null;
        } finally {
            runInAction(() => {
                boardsStore.isCreating = false;
            });
        }
    };
    
    return { createBoard, isCreating: boardsStore.isCreating };
};
