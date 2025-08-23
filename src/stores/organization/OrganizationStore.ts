import { makeAutoObservable } from 'mobx';
import { TrelloOrganization } from '../../types';
import { OrganizationModel } from '../../models';

class OrganizationStore {
  organizations: TrelloOrganization[] = [];
  currentOrganization: TrelloOrganization | null = null;
  organizationModels: Map<string, OrganizationModel> = new Map();
  isLoading: boolean = false;
  isCreating: boolean = false;
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

  setCurrentOrganizationById = (organizationId: string) => {
    const org = this.organizations.find(org => org.id === organizationId);
    if (org) {
      this.setCurrentOrganization(org);
    }
  };

  fetchOrganizations = async (): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) {
      console.error('Missing token or clientId');
      return;
    }

    this.isLoading = true;
    this.error = null;
    const previousCurrentOrg = this.currentOrganization; // Save the current org before fetching

    try {
      const url = `https://api.trello.com/1/members/me/organizations?key=${clientId}&token=${token}`;
      console.log('Fetching organizations from:', url);
      
      const response = await fetch(url);
      console.log('Organizations response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch organizations:', response.status, errorText);
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
      }

      const trelloOrgs = await response.json();
      console.log('Fetched organizations:', trelloOrgs);
      
      this.organizations = trelloOrgs.map((org: any) => {
        const orgData = {
          id: org.id,
          name: org.name,
          displayName: org.displayName || org.name,
          desc: org.desc || '',
          url: org.url || ''
        };
        console.log('Mapped organization:', orgData);
        return orgData;
      });

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

      // Set first organization as default if none selected, or restore the previous one if it exists
      if (this.organizations.length > 0) {
        if (previousCurrentOrg) {
          // Try to find the previous current org in the new list
          const existingOrg = this.organizations.find((org: TrelloOrganization) => org.id === previousCurrentOrg.id);
          this.currentOrganization = existingOrg || this.organizations[0];
        } else {
          this.currentOrganization = this.organizations[0];
        }
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

  createOrganization = async (name: string): Promise<TrelloOrganization | null> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) return null;

    this.isCreating = true;
    this.error = null;

    try {
      const response = await fetch(
        `https://api.trello.com/1/organizations?key=${clientId}&token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: name
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create organization: ${response.statusText}`);
      }

      const newOrg = await response.json();
      
      const orgToAdd: TrelloOrganization = {
        id: newOrg.id,
        name: newOrg.name,
        displayName: newOrg.displayName || newOrg.name,
        desc: newOrg.desc || '',
        url: newOrg.url || ''
      };

      this.organizations.push(orgToAdd);
      
      // Create OrganizationModel instance
      const orgModel = new OrganizationModel({
        id: orgToAdd.id,
        name: orgToAdd.name,
        displayName: orgToAdd.displayName,
        desc: orgToAdd.desc,
        url: orgToAdd.url
      });
      this.organizationModels.set(orgToAdd.id, orgModel);
      
      // Set as current organization
      this.currentOrganization = orgToAdd;
      
      return orgToAdd;

    } catch (error) {
      console.error('Error creating organization:', error);
      this.error = error instanceof Error ? error.message : 'Failed to create organization';
      return null;
    } finally {
      this.isCreating = false;
    }
  };

  reset = () => {
    this.organizations = [];
    this.currentOrganization = null;
    this.organizationModels.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
    this.isSwitching = false;
  };
}

export default OrganizationStore;
