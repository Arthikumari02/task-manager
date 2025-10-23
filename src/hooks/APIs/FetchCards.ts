import { useState } from 'react';
import { CardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useCardsStore , useListsStore} from "../../contexts";

interface FetchCardsOptions {
    onSuccess?: (cards: CardModel[]) => void;
    onError?: (error: string) => void;
}


export const useFetchCards = () => {
    const cardsStore = useCardsStore();
    const listsStore = useListsStore();
    const [isFetching, setIsFetching] = useState(false);

    const fetchCards = async (listId: string, boardIdOrOptions: string | FetchCardsOptions, options?: FetchCardsOptions): Promise<void> => {
        // Handle different parameter patterns
        let boardId: string;
        let fetchOptions: FetchCardsOptions | undefined;

        if (typeof boardIdOrOptions === 'string') {
            boardId = boardIdOrOptions;
            fetchOptions = options;
        } else {
            boardId = listId;
            fetchOptions = boardIdOrOptions;
        }

        const { token, clientId } = getAuthData();

        if (!token || !clientId || !boardId) {
            return;
        }

        setIsFetching(true);
        cardsStore.setLoading(true);
        cardsStore.setError(null);
        
        // Clear existing cards for this board to ensure fresh data on page reload
        cardsStore.clearCardsForBoard(boardId);

        try {
            const url = `https://api.trello.com/1/boards/${boardId}/cards?key=${clientId}&token=${token}&filter=open`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch cards: ${response.statusText}`);
            }

            const trelloCards = await response.json();
            const openListIds = new Set(listsStore.getListsForBoard(boardId).map(list => list.id));

            const cardModels = trelloCards
            .filter((card: any) => openListIds.has(card.idList))
            .map((card: any) => {
                const cardModel = new CardModel({
                    id: card.id,
                    name: card.name,
                    desc: card.desc || '',
                    closed: card.closed || false,
                    pos: card.pos || 0,
                    listId: card.idList,
                    boardId: boardId,
                    url: card.url || ''
                });
                cardsStore.addCard(cardModel);
                return cardModel
            }).filter((card: CardModel) => !card.closed);

            // Call the success callback if provided
            if (fetchOptions?.onSuccess) {
                fetchOptions.onSuccess(cardModels);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cards';
            cardsStore.setError(errorMessage);

            // Call the error callback if provided
            if (fetchOptions?.onError) {
                fetchOptions.onError(errorMessage);
            }
        } finally {
            setIsFetching(false);
            cardsStore.setLoading(false);
        }
    };

    return { fetchCards, isFetching };
};
