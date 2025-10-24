import { useState } from 'react';
// Removed runInAction import
import { CardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useCardsStore } from "../../contexts";
import { useSearchStore } from "../../contexts/SearchContext";

interface SearchOptions {
    onSuccess?: (cards: CardModel[]) => void;
    onError?: (error: string) => void;
}

export const useSearch = () => {
    const searchStore = useSearchStore();
    const [isSearching, setIsSearching] = useState(false);
    
    const performSearch = async (query: string, options?: SearchOptions): Promise<CardModel[]> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId || !query.trim()) {
            searchStore.setIsLoading(false); 
            searchStore.setSearchError(null);
            return [];
        }

        setIsSearching(true);
        searchStore.setIsLoading(true);

        try {
            const response = await fetch(
                `https://api.trello.com/1/search?key=${clientId}&token=${token}&query=${encodeURIComponent(query)}&modelTypes=cards&card_fields=id,name,desc,closed,pos,idList,idBoard,url`
            );

            if (!response.ok) {
                throw new Error(`Failed to search: ${response.statusText}`);
            }

            const data = await response.json();
            // Filter out closed cards and map to CardModel format
            const cards: CardModel[] = (data.cards || [])
                .filter((card: any) => !card.closed)
                .map((card: any) => new CardModel({
                    id: card.id,
                    name: card.name,
                    desc: card.desc || '',
                    closed: card.closed || false,
                    pos: card.pos || 0,
                    listId: card.idList,
                    boardId: card.idBoard,
                    url: card.url || ''
                }));
            
            searchStore.setSearchResults(cards); 
            searchStore.setSearchError(null);
            
            if (options?.onSuccess) {
                options.onSuccess(cards);
            }

            return cards;

        } catch (error) {
            console.error('Error searching cards:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to search cards';
            
            searchStore.setSearchError(errorMessage);

            if (options?.onError) {
                options.onError(errorMessage);
            }
            
            return [];
        } finally {
            setIsSearching(false);
            searchStore.setIsLoading(false);
        }
    };
    
    return { performSearch, isSearching };
};