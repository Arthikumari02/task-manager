import React from 'react';
import { AddListButtonProps } from '../../types';
import { useTranslation } from 'react-i18next';

const AddListButton: React.FC<AddListButtonProps> = ({ onClick }) => {
  const { t } = useTranslation('boards');
  return (
    <button
      onClick={onClick}
      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md px-1 py-2 w-60 flex-shrink-0 min-h-[80px] h-fit transition-colors flex items-center justify-center"
    >
      <span className="text-base">+ {t('addlist')}</span>
    </button>
  );
};

export default AddListButton;
