import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

export const useMoveCard = () => {
    const cardsStore = useCardsStore();
    
    const moveCard = async (boardId: string, cardId: string, sourceListId: string, targetListId: string, position: number): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        try {
            const response = await fetch(
                `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ idList: targetListId, pos: position })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to move card: ${response.statusText}`);
            }

            const updatedCard = await response.json();
            
            runInAction(() => {
                const card = cardsStore.getCardById(cardId);
                if (card) {
                    card.listId = updatedCard.idList;
                }
            });

            return true;
        } catch (error) {
            console.error('Error moving card:', error);
            runInAction(() => {
                cardsStore.error = error instanceof Error ? error.message : 'Failed to move card';
            });
            return false;
        }
    };
    
    return { moveCard };
};
