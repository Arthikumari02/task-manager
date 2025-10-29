import React from 'react';
import { useTranslation } from 'react-i18next';

interface ListContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onCloseList: () => void;
}

const ListContextMenu: React.FC<ListContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onCloseList
}) => {
  const { t } = useTranslation('boards');

  if (!isOpen) return null;

  const handleCloseList = () => {
    onCloseList();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]"
        style={{
          left: position.x,
          top: position.y
        }}
      >
        <button
          onClick={handleCloseList}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {t('closelist')}
        </button>
      </div>
    </>
  );
};

export default ListContextMenu;
