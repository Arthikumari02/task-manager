import { runInAction } from "mobx";
import { useAuth } from "../../contexts";
import { BoardModel } from "../../models";
import { useBoardsStore } from "../../contexts";

export const useFetchBoards = () => {
    const { token, clientId } = useAuth();
    const boardsStore = useBoardsStore();
    
    const fetchBoards = async (organizationId: string): Promise<void> => {
        if (!token || !clientId) {
            console.error('Missing token or clientId');
            return;
        }
        if (!organizationId) {
            console.error('No organizationId provided');
            return;
        }

        runInAction(() => {
            boardsStore.isLoading = true;
            boardsStore.error = null;
        });

    try {
        const url = `https://api.trello.com/1/organizations/${organizationId}/boards?key=${clientId}&token=${token}&filter=open`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch boards:', response.status, errorText);
            throw new Error(`Failed to fetch boards: ${response.status} ${response.statusText}`);
        }

        const trelloBoards = await response.json();

        const mappedBoards = trelloBoards.map((board: any) => {
            return {
                id: board.id,
                name: board.name,
                desc: board.desc || '',
                organizationId: organizationId,
                closed: board.closed || false,
                url: board.url || '',
                prefs: board.prefs || {}
            };
        });

        runInAction(() => {
            // Create BoardModel instances
            mappedBoards.forEach((boardData: BoardModel) => {
                const boardModel = new BoardModel({
                    id: boardData.id,
                    name: boardData.name,
                    desc: boardData.desc,
                    closed: boardData.closed,
                    url: boardData.url,
                    organizationId: boardData.organizationId
                });

                boardsStore.addBoardModel(boardModel);
            });
        });

    } catch (err) {
        console.error('Error fetching boards:', err);
        runInAction(() => {
            boardsStore.error = err instanceof Error ? err.message : 'Failed to fetch boards';
            // Clear board models on error
            boardsStore.resetState();
        });
    } finally {
        runInAction(() => {
            boardsStore.isLoading = false;
        });
    }
    };
    
    return fetchBoards;
};