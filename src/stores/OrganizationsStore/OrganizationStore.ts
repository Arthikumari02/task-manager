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
      addBoardToOrganization: action,
      removeBoardFromOrganization: action,
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
