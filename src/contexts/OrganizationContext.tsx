import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import OrganizationStore from '../stores/organization/OrganizationStore';
import { TrelloOrganization } from '../types';

interface OrganizationContextType extends Omit<OrganizationStore, 'currentOrganization' | 'setCurrentOrganization'> {
  currentOrganization: TrelloOrganization | null;
  setCurrentOrganization: (org: TrelloOrganization | null) => void;
  organizationModels: Map<string, any>; // Add this line to include organizationModels
  getAuthData: () => { token: string | null; clientId: string | null }; // Add this line to include getAuthData
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getAuthData = () => {
    const token = localStorage.getItem('trello_token');
    const clientId = localStorage.getItem('trello_clientId');
    return { token, clientId };
  };

  // Initialize store
  const organizationStoreRef = useRef(new OrganizationStore(getAuthData));
  const [currentOrganization, setCurrentOrgState] = useState<TrelloOrganization | null>(() => {
    const savedOrg = localStorage.getItem('currentOrganization');
    return savedOrg ? JSON.parse(savedOrg) : null;
  });

  // Update localStorage and store when current organization changes
  const setCurrentOrganization = (org: TrelloOrganization | null) => {
    if (org) {
      localStorage.setItem('currentOrganization', JSON.stringify(org));
      // Update the store's current organization
      organizationStoreRef.current.currentOrganization = org;
    } else {
      localStorage.removeItem('currentOrganization');
      organizationStoreRef.current.currentOrganization = null;
    }
    setCurrentOrgState(org);
  };

  // Fetch organizations on mount and when the store changes
  useEffect(() => {
    const store = organizationStoreRef.current;
    const fetchAndSetOrgs = async () => {
      await store.fetchOrganizations();
      // After fetching, ensure the current organization is set in the store
      if (currentOrganization && !store.currentOrganization) {
        store.currentOrganization = currentOrganization;
      } else if (store.organizations.length > 0 && !currentOrganization) {
        // If we have organizations but no current org, set the first one
        setCurrentOrganization(store.organizations[0]);
      }
    };
    
    fetchAndSetOrgs();
  }, []);

  const store = organizationStoreRef.current;
  const contextValue = {
    ...store,
    currentOrganization,
    setCurrentOrganization,
    organizationModels: store.organizationModels,
    getAuthData,
    organizationCount: store.organizationCount,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganizations = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
};
