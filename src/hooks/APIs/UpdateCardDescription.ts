import { useState } from 'react';
import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

interface UpdateCardDescriptionOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useUpdateCardDescription = () => {
    const cardsStore = useCardsStore();
    const [isUpdating, setIsUpdating] = useState(false);
    
    const updateCardDescription = async (cardId: string, newDescription: string, options?: UpdateCardDescriptionOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsUpdating(true);
        runInAction(() => {
            cardsStore.isLoading = true;
            cardsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ desc: newDescription })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update card description: ${response.statusText}`);
            }

            const updatedCard = await response.json();
            
            runInAction(() => {
                const card = cardsStore.getCardById(cardId);
                if (card) {
                    card.desc = updatedCard.desc;
                }
                cardsStore.isLoading = false;
            });

            if (options?.onSuccess) {
                options.onSuccess();
            }

            return true;
        } catch (error) {
            console.error('Error updating card description:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to update card description';
            
            runInAction(() => {
                cardsStore.error = errorMessage;
                cardsStore.isLoading = false;
            });

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsUpdating(false);
        }
    };
    
    return { updateCardDescription, isUpdating };
};
