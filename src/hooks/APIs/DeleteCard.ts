import { useState } from 'react';
import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

interface DeleteCardOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useDeleteCard = () => {
    const cardsStore = useCardsStore();
    const [isDeleting, setIsDeleting] = useState(false);
    
    const deleteCard = async (cardId: string, options?: DeleteCardOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsDeleting(true);
        runInAction(() => {
            cardsStore.isLoading = true;
            cardsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/cards/${cardId}?key=${clientId}&token=${token}`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to delete card: ${response.statusText}`);
            }

            runInAction(() => {
                // Remove the card from the store
                cardsStore.cardsMap.delete(cardId);
                cardsStore.isLoading = false;
            });

            if (options?.onSuccess) {
                options.onSuccess();
            }

            return true;
        } catch (error) {
            console.error('Error deleting card:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete card';
            
            runInAction(() => {
                cardsStore.error = errorMessage;
                cardsStore.isLoading = false;
            });

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsDeleting(false);
        }
    };
    
    return { deleteCard, isDeleting };
};
