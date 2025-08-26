import { runInAction } from "mobx";
import { CardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

export const useCreateCard = () => {
    const cardsStore = useCardsStore();

    const createCard = async (listId: string, name: string, onSuccess?: (cardModel: CardModel) => void): Promise<CardModel | null> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId || !listId) return null;

        runInAction(() => {
            cardsStore.isCreating = true;
            cardsStore.error = null;
        });

        try {
            const response = await fetch(
                `https://api.trello.com/1/cards?key=${clientId}&token=${token}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        idList: listId,
                        pos: 'bottom' // Add position parameter to place the card at the end
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to create card: ${response.statusText}`);
            }

            const newCard = await response.json();

            const cardModel = new CardModel({
                id: newCard.id,
                name: newCard.name,
                desc: newCard.desc || '',
                listId: listId,
                pos: newCard.pos || 0,
                closed: newCard.closed || false,
                boardId: newCard.idBoard || '',
                url: newCard.url || ''
            });

            runInAction(() => {
                cardsStore.cardsMap.set(cardModel.id, cardModel);
            });

            // Notify callback if provided
            if (onSuccess) {
                onSuccess(cardModel);
            }

            return cardModel;

        } catch (error) {
            console.error('Error creating card:', error);
            runInAction(() => {
                cardsStore.error = error instanceof Error ? error.message : 'Failed to create card';
            });
            return null;
        } finally {
            runInAction(() => {
                cardsStore.isCreating = false;
            });
        }
    };

    return { createCard, isCreating: cardsStore.isCreating };
};
