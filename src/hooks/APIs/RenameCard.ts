import { useState } from 'react';
import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

interface RenameCardOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useRenameCard = () => {
    const cardsStore = useCardsStore();
    const [isRenaming, setIsRenaming] = useState(false);
    
    const renameCard = async (cardId: string, newName: string, options?: RenameCardOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsRenaming(true);
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
                    body: JSON.stringify({ name: newName })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to rename card: ${response.statusText}`);
            }

            const updatedCard = await response.json();
            
            runInAction(() => {
                const card = cardsStore.getCardById(cardId);
                if (card) {
                    card.name = updatedCard.name;
                }
                cardsStore.isLoading = false;
            });

            if (options?.onSuccess) {
                options.onSuccess();
            }

            return true;
        } catch (error) {
            console.error('Error renaming card:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to rename card';
            
            runInAction(() => {
                cardsStore.error = errorMessage;
                cardsStore.isLoading = false;
            });

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsRenaming(false);
        }
    };
    
    return { renameCard, isRenaming };
};
