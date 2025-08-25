import React, { createContext, useContext, useRef } from 'react';
import OrganizationStore from '../stores/organization/OrganizationStore';

const OrganizationContext = createContext<OrganizationStore | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  const organizationStoreRef = useRef(new OrganizationStore(getAuthData));

  return (
    <OrganizationContext.Provider value={organizationStoreRef.current}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizations = (): OrganizationStore => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
};
