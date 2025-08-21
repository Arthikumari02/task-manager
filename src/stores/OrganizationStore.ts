import { BaseStore } from './BaseStore';
import { TrelloOrganization } from '../types';

export interface OrganizationStoreState {
  organizations: TrelloOrganization[];
  currentOrganization: TrelloOrganization | null;
  isSwitching: boolean;
  isLoading: boolean;
  error: string | null;
}

export class OrganizationStore extends BaseStore {
  constructor(setState: (updater: (prev: OrganizationStoreState) => OrganizationStoreState) => void, token: string | null, clientId: string | null) {
    super(setState, token, clientId);
  }

  async fetchOrganizations(): Promise<void> {
    if (!this.token || !this.clientId) return;

    this.setLoading(true);
    this.setError(null);

    const trelloOrgs = await this.makeApiCall<any[]>(
      `https://api.trello.com/1/members/me/organizations?key=${this.clientId}&token=${this.token}`,
      {},
      'Failed to fetch organizations'
    );

    if (trelloOrgs) {
      const fetchedOrganizations = trelloOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName || org.name,
        desc: org.desc || '',
        url: org.url || ''
      }));

      this.setState((prev: OrganizationStoreState) => ({
        ...prev,
        organizations: fetchedOrganizations,
        currentOrganization: fetchedOrganizations.length > 0 && !prev.currentOrganization 
          ? fetchedOrganizations[0] 
          : prev.currentOrganization
      }));
    } else {
      this.setState((prev: OrganizationStoreState) => ({
        ...prev,
        organizations: [],
        currentOrganization: null
      }));
    }

    this.setLoading(false);
  }

  setCurrentOrganization(organization: TrelloOrganization): void {
    this.setState((prev: OrganizationStoreState) => ({
      ...prev,
      isSwitching: true,
      currentOrganization: organization
    }));
    
    // Reset switching state after a brief moment
    setTimeout(() => {
      this.setState((prev: OrganizationStoreState) => ({
        ...prev,
        isSwitching: false
      }));
    }, 100);
  }

  reset(): void {
    super.reset();
    this.setState((prev: OrganizationStoreState) => ({
      ...prev,
      organizations: [],
      currentOrganization: null,
      isSwitching: false
    }));
  }
}
