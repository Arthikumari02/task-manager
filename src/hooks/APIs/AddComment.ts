import { useState } from 'react';
import { runInAction } from "mobx";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

interface AddCommentOptions {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export const useAddComment = () => {
    const cardsStore = useCardsStore();
    const [isAdding, setIsAdding] = useState(false);
    
    const addComment = async (cardId: string, commentText: string, options?: AddCommentOptions): Promise<boolean> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return false;

        setIsAdding(true);
        runInAction(() => {
            cardsStore.isLoading = true;
            cardsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/cards/${cardId}/actions/comments?key=${clientId}&token=${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: commentText })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to add comment: ${response.statusText}`);
            }

            const result = await response.json();
            
            runInAction(() => {
                // Store the comment in the card store's commentsMap instead
                // since CardModel doesn't have a comments property
                const commentData = {
                    id: result.id,
                    text: commentText,
                    date: new Date().toISOString(),
                    cardId: cardId,
                    memberCreator: result.memberCreator || { fullName: 'You' }
                };
                
                // Add to comments collection in the store
                const commentsForCard = cardsStore.commentsMap.get(cardId) || [];
                cardsStore.commentsMap.set(cardId, [...commentsForCard, commentData]);
                cardsStore.isLoading = false;
            });

            if (options?.onSuccess) {
                options.onSuccess();
            }

            return true;
        } catch (error) {
            console.error('Error adding comment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
            
            runInAction(() => {
                cardsStore.error = errorMessage;
                cardsStore.isLoading = false;
            });

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return false;
        } finally {
            setIsAdding(false);
        }
    };
    
    return { addComment, isAdding };
};
