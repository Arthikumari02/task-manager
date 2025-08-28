// Removed runInAction import
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";
import { useFetchCards } from "./FetchCards";

export const useReorderCardsInList = () => {
    const cardsStore = useCardsStore();
    const fetchCards = useFetchCards();

    const reorderCardsInList = async (boardId: string, listId: string, sourceIndex: number, destinationIndex: number): Promise<void> => {
        const cards = cardsStore.getCardsForList(boardId, listId).slice();

        if (cards.length === 0 || sourceIndex === destinationIndex) {
            return;
        }

        const [movedCard] = cards.splice(sourceIndex, 1);
        cards.splice(destinationIndex, 0, movedCard);

        // Update local order: adjust pos hints immediately
        cards.forEach((card: { pos: number }) => {
            card.pos = card.pos ?? 0;
        });
        cardsStore.updateCardPositions(cards);

        // Calculate new position for Trello API
        const { token, clientId } = getAuthData();
        if (!token || !clientId) {
            return;
        }

        try {
            let newPos: number | string;

            if (destinationIndex === 0) {
                newPos = 'top';
            } else if (destinationIndex === cards.length - 1) {
                newPos = 'bottom';
            } else {
                const prevCard = cards[destinationIndex - 1];
                const nextCard = cards[destinationIndex + 1];
                newPos = (prevCard.pos + nextCard.pos) / 2;
            }

            const response = await fetch(
                `https://api.trello.com/1/cards/${movedCard.id}?key=${clientId}&token=${token}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pos: newPos })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update card position: ${response.statusText}`);
            }

            const updatedCard = await response.json();

            // Update the card's position with the actual value returned from Trello
            cardsStore.updateCardPosition(movedCard.id, updatedCard.pos);

        } catch (error) {
            console.error('Error reordering cards:', error);
            cardsStore.setError(error instanceof Error ? error.message : 'Failed to reorder cards');
            // Re-fetch to restore
            // Need to get the boardId from the card
            const card = cardsStore.getCardById(movedCard.id);
            if (card) {
                // Using the hook function directly since we're already inside the hook
                await fetchCards.fetchCards(card.boardId, {
                    onSuccess: (cards) => console.log('Cards refreshed after reordering error'),
                    onError: (error) => console.error('Error refreshing cards:', error)
                });
            }
        }
    };

    return reorderCardsInList;
};
