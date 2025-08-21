import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from '../../../components/Header';
import Loading from '../../../components/Loading';
import { useBoardData } from '../../../hooks';
import BoardHeader from './BoardHeader';
import BoardContent from './BoardContent';

const BoardView: React.FC = observer(() => {
  const { boardId } = useParams<{ boardId: string }>();
  const { boardName, lists, cards, isLoading, handleTaskAdded } = useBoardData(boardId);
  const [showNewListInput, setShowNewListInput] = useState(false);

  const handleListAdded = () => {
    setShowNewListInput(false);
  };

  const handleCancelAddList = () => {
    setShowNewListInput(false);
  };

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header
        title="Task Manager"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <main className="px-2 sm:px-4 py-4 sm:py-6">
        <BoardHeader boardName={boardName} />

        {isLoading ? (
          <Loading message="Loading" size="large" className="text-white" />
        ) : (
          <BoardContent
            boardId={boardId}
            lists={lists}
            cards={cards}
            showNewListInput={showNewListInput}
            onTaskAdded={handleTaskAdded}
            onListAdded={handleListAdded}
            onCancelAddList={handleCancelAddList}
            onShowAddListForm={() => setShowNewListInput(true)}
          />
        )}
      </main>
    </div>
  );
});

export default BoardView;
