import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { TrelloCard } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TrelloCard | null;
  listName: string;
  onUpdateDescription: (cardId: string, description: string) => void;
  onDeleteTask: (cardId: string) => void;
  onAddComment: (cardId: string, comment: string) => void;
  onTaskRename: (cardId: string, newName: string) => void; // Add this prop
}

interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
}

const TaskModal: React.FC<TaskModalProps> = observer(({
  isOpen,
  onClose,
  task,
  listName,
  onUpdateDescription,
  onDeleteTask,
  onAddComment,
  onTaskRename
}) => {
  const { userInfo } = useAuth();
  const [description, setDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  // Add state for title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setDescription(task.desc || '');
      setTaskTitle(task.name || '');
    }
  }, [task?.id, task?.name, task?.desc]); // Add dependencies to update when task properties change

  if (!isOpen || !task) return null;

  const handleDescriptionSave = () => {
    setIsEditingDescription(false);
    if (description !== task.desc) {
      onUpdateDescription(task.id, description);
    }
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setDescription(task.desc || '');
  };

  // Add title editing handlers
  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (taskTitle.trim() && taskTitle !== task.name) {
      await onTaskRename(task.id, taskTitle.trim());
      // Task name should now be updated in the store, which will trigger a re-render
      // with the updated task prop
    } else {
      setTaskTitle(task.name || ''); // Reset if empty or unchanged
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTaskTitle(task.name || '');
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        text: comment.trim(),
        author: userInfo?.initials || 'WJ',
        date: new Date().toLocaleDateString()
      };
      setComments([...comments, newComment]);
      onAddComment(task.id, comment.trim());
      setComment('');
    }
  };

  const handleDeleteTask = () => {
    onDeleteTask(task.id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden md:rounded-lg md:shadow-xl sm:rounded-none sm:shadow-none sm:max-h-full sm:h-full sm:m-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sm:p-4">
            <div className="flex-1">
              {/* Editable Task Title */}
              {isEditingTitle ? (
                <input
                  type="text"
                  value={taskTitle}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-xl font-semibold text-gray-900 mb-1 w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <h2
                  className="text-xl font-semibold text-gray-900 mb-1 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
                  onClick={handleTitleClick}
                  title="Click to edit title"
                >
                  {taskTitle}
                </h2>
              )}
              <p className="text-sm text-gray-500">
                in list {listName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteTask}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete task"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] sm:p-4 sm:max-h-[calc(100vh-120px)]">
            {/* Description Section */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
              </div>
              <div className="border-t border-gray-200 pt-2">
                {isEditingDescription ? (
                  <div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a more detailed description..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      autoFocus
                    />
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={handleDescriptionSave}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleDescriptionCancel}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="min-h-[60px] p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className="text-gray-400">Add a more detailed description...</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Activity Section */}
            <div>
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-700">Activity</h3>
              </div>
              <div className="border-t border-gray-200 pt-2">
                {/* Comments */}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 mb-4">
                    <div className="w-8 h-8 bg-[#4E97C2] rounded-full flex items-center justify-center text-[#0079BF] text-sm font-medium">
                      {comment.author}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{comment.date}</p>
                    </div>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-[#4E97C2] rounded-full flex items-center justify-center text-[#0079BF] text-sm font-medium">
                    {userInfo?.initials || 'WJ'}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default TaskModal;