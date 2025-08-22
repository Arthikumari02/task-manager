import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import Header from '../../../components/Header';
import Loading from '../../../components/Loading';
import { useBoardData } from '../../../hooks';
import { ListProvider, CardProvider } from '../../../contexts';
import BoardHeader from './BoardHeader';
import BoardContent from './BoardContent';

const BoardViewContent: React.FC<{ boardId: string | undefined }> = observer(({ boardId }) => {
  const { boardName, lists, cards, isLoading, handleTaskAdded, listsMap, cardsByListMap } = useBoardData(boardId);

  // Debug logging to check if lists are being fetched
  const [showNewListInput, setShowNewListInput] = useState(false);

  const handleListAdded = () => {
    setShowNewListInput(false);
  };

  const handleCancelAddList = () => {
    setShowNewListInput(false);
  };

  return (
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
          listsMap={listsMap}
          cardsByListMap={cardsByListMap}
        />
      )}
    </main>
  );
});

const BoardView: React.FC = observer(() => {
  const { boardId } = useParams<{ boardId: string }>();

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header
        title="Task Manager"
        currentPage="boards"
        showSearch={true}
        showNavigation={true}
      />

      <ListProvider>
        <CardProvider>
          <BoardViewContent boardId={boardId} />
        </CardProvider>
      </ListProvider>
    </div>
  );
});

export default BoardView;
