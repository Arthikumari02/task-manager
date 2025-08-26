import { makeObservable, observable, computed, action } from 'mobx';
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
    makeObservable(this, {
      // Observable properties
      organizations: observable,
      currentOrganization: observable,
      organizationModels: observable,
      isLoading: observable,
      isCreating: observable,
      error: observable,
      isSwitching: observable,

      // Computed properties
      organizationCount: computed,

      // Actions
      setCurrentOrganization: action,
      setCurrentOrganizationById: action,
      fetchOrganizations: action,
      addBoardToOrganization: action,
      removeBoardFromOrganization: action,
      createOrganization: action,
      reset: action,
      loadSavedOrganization: action
    });

    // Load the saved organization on initialization
    this.loadSavedOrganization();
  }

  // Computed values for better performance and clean code
  get organizationCount(): number {
    return this.organizationModels.size;
  }

  setCurrentOrganization = (organization: TrelloOrganization | null) => {
    this.isSwitching = true;
    this.currentOrganization = organization;
    // Save the selected organization to localStorage or remove it if null
    if (organization) {
      localStorage.setItem('current_organization', JSON.stringify(organization));
    } else {
      localStorage.removeItem('current_organization');
    }
    this.isSwitching = false;
  };

  setCurrentOrganizationById = (organizationId: string) => {
    const org = this.organizations.find(org => org.id === organizationId);
    if (org) {
      this.setCurrentOrganization(org); // Pass the org to setCurrentOrganization instead of setting currentOrganization directly
    }
  };

  fetchOrganizations = async (): Promise<void> => {
    const { token, clientId } = this.getAuthData();
    if (!token || !clientId) {
      console.error('Missing token or clientId');
      return;
    }

    this.setLoading(true);
    this.setError(null);
    const previousCurrentOrg = this.currentOrganization; // Save the current org before fetching

    try {
      const url = `https://api.trello.com/1/members/me/organizations?key=${clientId}&token=${token}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch organizations:', response.status, errorText);
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
      }

      const trelloOrgs = await response.json();

      const mappedOrgs = trelloOrgs.map((org: any) => {
        const orgData = {
          id: org.id,
          name: org.name,
          displayName: org.displayName || org.name,
          desc: org.desc || '',
          url: org.url || ''
        };
        return orgData;
      });

      // Update organizations in an action
      this.updateOrganizations(mappedOrgs);

      // Create OrganizationModel instances
      this.updateOrganizationModels(mappedOrgs);

      // Set first organization as default if none selected, or restore the previous one if it exists
      if (this.organizations.length > 0) {
        if (previousCurrentOrg) {
          // Try to find the previous current org in the new list
          const existingOrg = this.organizations.find((org: TrelloOrganization) => org.id === previousCurrentOrg.id);
          this.setCurrentOrganization(existingOrg || this.organizations[0]);
        } else {
          // Try to load from localStorage first
          const savedOrg = this.loadSavedOrganization();
          if (savedOrg) {
            // Find the saved org in the fetched list
            const existingOrg = this.organizations.find((org: TrelloOrganization) => org.id === savedOrg.id);
            this.setCurrentOrganization(existingOrg || this.organizations[0]);
          } else {
            this.setCurrentOrganization(this.organizations[0]);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching organizations:', err);
      this.setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      this.updateOrganizations([]);
      this.setCurrentOrganization(null);
    } finally {
      this.setLoading(false);
    }
  };
  
  // Helper actions for updating observable state
  setLoading = action((value: boolean) => {
    this.isLoading = value;
  });
  
  setError = action((value: string | null) => {
    this.error = value;
  });
  
  updateOrganizations = action((orgs: TrelloOrganization[]) => {
    this.organizations = orgs;
  });
  
  updateOrganizationModels = action((orgs: TrelloOrganization[]) => {
    orgs.forEach(orgData => {
      const orgModel = new OrganizationModel({
        id: orgData.id,
        name: orgData.name,
        displayName: orgData.displayName,
        desc: orgData.desc,
        url: orgData.url
      });
      this.organizationModels.set(orgData.id, orgModel);
    });
  });

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

    this.setCreating(true);
    this.setError(null);

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

      // Add the new organization to the existing ones
      this.addOrganization(orgToAdd);

      // Create OrganizationModel instance
      this.addOrganizationModel(orgToAdd);

      // Set as current organization
      this.setCurrentOrganization(orgToAdd);

      return orgToAdd;

    } catch (error) {
      console.error('Error creating organization:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to create organization');
      return null;
    } finally {
      this.setCreating(false);
    }
  };
  
  setCreating = action((value: boolean) => {
    this.isCreating = value;
  });
  
  addOrganization = action((org: TrelloOrganization) => {
    this.organizations = [...this.organizations, org];
  });
  
  addOrganizationModel = action((org: TrelloOrganization) => {
    const orgModel = new OrganizationModel({
      id: org.id,
      name: org.name,
      displayName: org.displayName,
      desc: org.desc,
      url: org.url
    });
    this.organizationModels.set(org.id, orgModel);
  });

  reset = () => {
    this.organizations = [];
    this.currentOrganization = null;
    this.organizationModels.clear();
    this.error = null;
    this.isLoading = false;
    this.isCreating = false;
    this.isSwitching = false;
    // Clear the saved organization from localStorage
    localStorage.removeItem('current_organization');
  };

  // Load the saved organization from localStorage
  loadSavedOrganization = (): TrelloOrganization | null => {
    try {
      const savedOrg = localStorage.getItem('current_organization');
      if (savedOrg) {
        const parsedOrg = JSON.parse(savedOrg) as TrelloOrganization;
        // Only set if we don't already have a current organization
        if (!this.currentOrganization) {
          this.setCurrentOrganizationInternal(parsedOrg);
        }
        return parsedOrg;
      }
    } catch (error) {
      console.error('Error loading saved organization:', error);
      localStorage.removeItem('current_organization');
    }
    return null;
  };
  
  // Internal action to set current organization without the switching flag logic
  setCurrentOrganizationInternal = action((organization: TrelloOrganization | null) => {
    this.currentOrganization = organization;
  });
}

export default OrganizationStore;
