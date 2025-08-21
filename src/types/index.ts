// Trello API Types
export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  boardId: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  pos: number;
  listId: string;
  boardId: string;
  url: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
  url: string;
  shortUrl?: string;
  organizationId: string;
  prefs: {
    backgroundColor?: string;
    backgroundImage?: string;
  };
}

export interface TrelloOrganization {
  id: string;
  name: string;
  displayName: string;
  desc: string;
  url: string;
}

// Component Props Types
export interface BoardHeaderProps {
  boardName: string;
}

export interface BoardContentProps {
  boardId: string | undefined;
  lists: TrelloList[];
  cards: TrelloCard[];
  showNewListInput: boolean;
  onTaskAdded: () => void;
  onListAdded: () => void;
  onCancelAddList: () => void;
  onShowAddListForm: () => void;
}

export interface BoardListProps {
  list: TrelloList;
  cards: TrelloCard[];
  onTaskAdded: () => void;
  onRenameList: (listId: string, newName: string) => void;
  onTaskRename: (taskId: string, newName: string) => void;
}

export interface TaskCardProps {
  id: string;
  name: string;
  desc?: string;
  index: number;
  onTaskRename: (taskId: string, newName: string) => void;
}

export interface AddTaskFormProps {
  listId: string;
  onTaskAdded: () => void;
  onCancel: () => void;
}

export interface AddListFormProps {
  boardId: string;
  onListAdded: () => void;
  onCancel: () => void;
  isFirstList?: boolean;
}

export interface AddListButtonProps {
  onClick: () => void;
}

export interface EmptyBoardStateProps {
  onAddFirstList: () => void;
}

// Custom Hook Types
export interface UseBoardDataReturn {
  boardName: string;
  lists: TrelloList[];
  cards: TrelloCard[];
  isLoading: boolean;
  handleTaskAdded: () => void;
}

// Header Component Types
export interface HeaderProps {
  title: string;
  currentPage: string;
  showSearch?: boolean;
  showNavigation?: boolean;
}

// Loading Component Types
export interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}
