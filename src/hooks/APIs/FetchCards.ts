import { useState } from 'react';
import { runInAction } from "mobx";
import { CardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";

interface FetchCardsOptions {
    onSuccess?: (cards: CardModel[]) => void;
    onError?: (error: string) => void;
}

export const useFetchCards = () => {
    const cardsStore = useCardsStore();
    const [isFetching, setIsFetching] = useState(false);
    
    const fetchCards = async (listId: string, boardId: string, options?: FetchCardsOptions): Promise<void> => {
        const { token, clientId } = getAuthData();

        if (!token || !clientId || !listId) {
            return;
        }

        // Check if we've fetched this list recently
        const now = Date.now();
        const lastFetch = cardsStore.lastFetchTimes.get(listId) || 0;
        if (now - lastFetch < cardsStore.fetchDebounceMs) {
            // Return existing data instead of fetching again
            const existingCards = cardsStore.getCardsForList(boardId, listId);
            if (existingCards.length > 0 && options?.onSuccess) {
                // Convert TrelloCard[] to CardModel[]
                const cardModels = existingCards.map((card: { id: string }) => cardsStore.getCardById(card.id)).filter(Boolean) as CardModel[];
                options.onSuccess(cardModels);
                return;
            }
        }

        setIsFetching(true);
        runInAction(() => {
            // Update last fetch time
            cardsStore.lastFetchTimes.set(listId, now);
            cardsStore.isLoading = true;
            cardsStore.error = null;
        });

        try {
            const url = `https://api.trello.com/1/lists/${listId}/cards?key=${clientId}&token=${token}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch cards: ${response.statusText}`);
            }

            const trelloCards = await response.json();
            const cardModelsToAdd: CardModel[] = [];

            runInAction(() => {
                trelloCards.forEach((card: any) => {
                    const cardModel = new CardModel({
                        id: card.id,
                        name: card.name,
                        desc: card.desc || '',
                        listId: listId,
                        pos: card.pos || 0,
                        closed: card.closed || false,
                        boardId: card.idBoard || '',
                        url: card.url || ''
                    });

                    cardsStore.cardsMap.set(cardModel.id, cardModel);
                    cardModelsToAdd.push(cardModel);
                });
            });

            if (options?.onSuccess) {
                options.onSuccess(cardModelsToAdd);
            }

        } catch (err) {
            console.error('Error fetching cards:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cards';
            
            runInAction(() => {
                cardsStore.error = errorMessage;
            });
            
            if (options?.onError) {
                options.onError(errorMessage);
            }
        } finally {
            setIsFetching(false);
            runInAction(() => {
                cardsStore.isLoading = false;
            });
        }
    };
    
    return { fetchCards, isFetching };
};
