import { makeAutoObservable, runInAction } from 'mobx';
import { TrelloOrganization } from '../../types';

class OrganizationStore {
  organizations: TrelloOrganization[] = [];
  currentOrganization: TrelloOrganization | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  isSwitching: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  setCurrentOrganization = (organization: TrelloOrganization) => {
    this.isSwitching = true;
    this.currentOrganization = organization;
    this.isSwitching = false;
  };

  fetchOrganizations = async (): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return;

    this.isLoading = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/members/me/organizations?key=${clientId}&token=${token}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.statusText}`);
      }

      const trelloOrgs = await response.json();
      
      runInAction(() => {
        this.organizations = trelloOrgs.map((org: any) => ({
          id: org.id,
          name: org.name,
          displayName: org.displayName || org.name,
          desc: org.desc || '',
          url: org.url || ''
        }));

        // Set first organization as default if none selected
        if (this.organizations.length > 0 && !this.currentOrganization) {
          this.currentOrganization = this.organizations[0];
        }
      });

    } catch (err) {
      console.error('Error fetching organizations:', err);
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch organizations';
        this.organizations = [];
        this.currentOrganization = null;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  reset = () => {
    this.organizations = [];
    this.currentOrganization = null;
    this.error = null;
    this.isLoading = false;
    this.isSwitching = false;
  };
}

export default OrganizationStore;
