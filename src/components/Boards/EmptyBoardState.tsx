import React from 'react';
import Icon from '../../assets/icons';
import { EmptyBoardStateProps } from '../../types';
import { useTranslation } from 'react-i18next';

const EmptyBoardState: React.FC<EmptyBoardStateProps> = ({ onAddFirstList }) => {
  const { t } = useTranslation('boards');
  return (
    <div className="text-center py-12 w-full">
      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon type="plus" className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-white text-lg font-semibold mb-2">{t('emptyboardsstate.title')}</h3>
      <p className="text-white text-opacity-80 mb-4">{t('emptyboardsstate.description')}</p>
      <button
        onClick={onAddFirstList}
        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-sm transition-colors flex items-center space-x-2 mx-auto"
      >
        <Icon type="plus" className="w-4 h-4" />
        <span>{t('emptyboardsstate.button')}</span>
      </button>
    </div>
  );
};

export default EmptyBoardState;
