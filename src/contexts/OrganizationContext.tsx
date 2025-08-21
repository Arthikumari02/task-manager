import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useAuth, useLogoutListener } from './AuthContext';
import { TrelloOrganization } from '../types';

interface OrganizationContextType {
  organizations: TrelloOrganization[];
  currentOrganization: TrelloOrganization | null;
  isLoading: boolean;
  error: string | null;
  isSwitching: boolean;
  fetchOrganizations: () => Promise<void>;
  setCurrentOrganization: (organization: TrelloOrganization) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { token, clientId } = useAuth();
  const [organizations, setOrganizations] = useState<TrelloOrganization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<TrelloOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Reset data on logout
  const resetData = useCallback(() => {
    setOrganizations([]);
    setCurrentOrganizationState(null);
    setIsLoading(false);
    setError(null);
    setIsSwitching(false);
  }, []);

  useLogoutListener(resetData);

  const fetchOrganizations = useCallback(async () => {
    if (!token || !clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me/organizations?key=${clientId}&token=${token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.statusText}`);
      }

      const trelloOrgs = await response.json();
      
      const fetchedOrganizations = trelloOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName || org.name,
        desc: org.desc || '',
        url: org.url || ''
      }));

      setOrganizations(fetchedOrganizations);

      // Set first organization as default if none selected
      if (fetchedOrganizations.length > 0 && !currentOrganization) {
        setCurrentOrganizationState(fetchedOrganizations[0]);
      }

    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      setOrganizations([]);
      setCurrentOrganizationState(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, clientId, currentOrganization]);

  const setCurrentOrganization = useCallback((organization: TrelloOrganization) => {
    setIsSwitching(true);
    setCurrentOrganizationState(organization);
    setIsSwitching(false);
  }, []);

  const value: OrganizationContextType = {
    organizations,
    currentOrganization,
    isLoading,
    error,
    isSwitching,
    fetchOrganizations,
    setCurrentOrganization,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganizations = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizations must be used within an OrganizationProvider');
  }
  return context;
};
