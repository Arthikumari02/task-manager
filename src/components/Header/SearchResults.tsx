import React from 'react';
import Icon from '../../assets/icons';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../contexts/SearchContext';
import Loading from '../Loading';

const SearchResults: React.FC = observer(() => {
    const { searchCards, isSearching, hasResults, searchError } = useSearchStore();
    const navigate = useNavigate();

    const handleTaskClick = (taskId: string, boardId: string) => {
        navigate(`/board/${boardId}`);
    };

    if (isSearching) {
        return (
            <div className="flex items-center justify-center p-6">
                <Loading message="Searching..." size="medium" />
            </div>
        );
    }

    if (searchError) {
        return (
            <div className="flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="text-red-500 text-lg font-semibold mb-2">Search Error</div>
                    <div className="text-gray-600">{searchError}</div>
                </div>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="flex items-center justify-center p-6 min-h-[200px]">
                <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-3">🔍</div>
                    <div className="text-gray-600 text-base font-medium mb-1">
                        We couldn't find any cards or boards that matched your search.
                    </div>
                    <div className="text-gray-500 text-sm">Try searching with different keywords</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900">
                    Search Results ({searchCards.length})
                </h2>
            </div>

            <div className="space-y-2">
                {searchCards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => handleTaskClick(card.id, card.boardId)}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900 mb-1">
                                    {card.name}
                                </h3>
                                {card.desc && (
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                        {card.desc}
                                    </p>
                                )}
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Task
                                    </span>
                                    <span>•</span>
                                    <span>Board: {card.boardId}</span>
                                </div>
                            </div>
                            <div className="ml-3">
                                <Icon type="chevronRight" className="w-4 h-4 text-gray-400" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default SearchResults;