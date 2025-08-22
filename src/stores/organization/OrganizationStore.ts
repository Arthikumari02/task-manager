import { makeAutoObservable } from 'mobx';
import { TrelloOrganization } from '../../types';
import { OrganizationModel } from '../../models';

class OrganizationStore {
  organizations: TrelloOrganization[] = [];
  currentOrganization: TrelloOrganization | null = null;
  private organizationModels: Map<string, OrganizationModel> = new Map();
  isLoading: boolean = false;
  error: string | null = null;
  isSwitching: boolean = false;

  constructor(private getAuthData: () => { token: string | null; clientId: string | null }) {
    makeAutoObservable(this);
  }

  // Computed values for better performance and clean code
  get organizationCount(): number {
    return this.organizationModels.size;
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
      
      this.organizations = trelloOrgs.map((org: any) => ({
        id: org.id,
        name: org.name,
        displayName: org.displayName || org.name,
        desc: org.desc || '',
        url: org.url || ''
      }));

      // Create OrganizationModel instances
      this.organizations.forEach(orgData => {
        const orgModel = new OrganizationModel({
          id: orgData.id,
          name: orgData.name,
          displayName: orgData.displayName,
          desc: orgData.desc,
          url: orgData.url
        });
        this.organizationModels.set(orgData.id, orgModel);
      });

      // Set first organization as default if none selected
      if (this.organizations.length > 0 && !this.currentOrganization) {
        this.currentOrganization = this.organizations[0];
      }

    } catch (err) {
      console.error('Error fetching organizations:', err);
      this.error = err instanceof Error ? err.message : 'Failed to fetch organizations';
      this.organizations = [];
      this.currentOrganization = null;
    } finally {
      this.isLoading = false;
    }
  };

  // OrganizationModel access methods
  getOrganizationById = (orgId: string): OrganizationModel | undefined => {
    return this.organizationModels.get(orgId);
  }

  addBoardToOrganization = (orgId: string, boardId: string): void => {
    const org = this.organizationModels.get(orgId);
    if (org) {
      org.addBoardId(boardId);
    }
  }

  removeBoardFromOrganization = (orgId: string, boardId: string): void => {
    const org = this.organizationModels.get(orgId);
    if (org) {
      org.removeBoardId(boardId);
    }
  }

  reset = () => {
    this.organizations = [];
    this.currentOrganization = null;
    this.organizationModels.clear();
    this.error = null;
    this.isLoading = false;
    this.isSwitching = false;
  };
}

export default OrganizationStore;
