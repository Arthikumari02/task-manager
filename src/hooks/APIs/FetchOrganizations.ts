import { TrelloOrganization } from "../../types";
import { getAuthData } from "../../utils/auth";
import { useOrganizationsStore } from "../../contexts";
import { apiTracker } from "../../utils/apiTracker";

export const useFetchOrganizations = () => {
    const organizationsStore = useOrganizationsStore();

    const fetchOrganizations = async (): Promise<void> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) {
            console.error('Missing token or clientId');
            return;
        }

        // Always fetch fresh data on explicit calls to fetchOrganizations
        // This ensures we get updated data on page reload

        // Use the centralized API tracker to prevent duplicate calls
        return apiTracker.trackPromise('fetchOrganizations', async () => {
            organizationsStore.setLoading(true);
            organizationsStore.setError(null);

            const previousCurrentOrg = organizationsStore.currentOrganization;

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

                // Update organizations
                organizationsStore.updateOrganizations(mappedOrgs);

                // Create OrganizationModel instances
                organizationsStore.updateOrganizationModels(mappedOrgs);

                // Set first organization as default if none selected, or restore the previous one if it exists
                if (organizationsStore.organizations.length > 0) {
                    if (previousCurrentOrg) {
                        // Try to find the previous current org in the new list
                        const existingOrg = organizationsStore.organizations.find(
                            (org: TrelloOrganization) => org.id === previousCurrentOrg.id
                        );
                        organizationsStore.setCurrentOrganization(existingOrg || organizationsStore.organizations[0]);
                    } else {
                        // Try to load from localStorage first
                        const savedOrg = organizationsStore.loadSavedOrganization();
                        if (savedOrg) {
                            // Find the saved org in the fetched list
                            const existingOrg = organizationsStore.organizations.find(
                                (org: TrelloOrganization) => org.id === savedOrg.id
                            );
                            organizationsStore.setCurrentOrganization(existingOrg || organizationsStore.organizations[0]);
                        } else {
                            organizationsStore.setCurrentOrganization(organizationsStore.organizations[0]);
                        }
                    }
                }

            } catch (err) {
                console.error('Error fetching organizations:', err);
                organizationsStore.setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
                organizationsStore.updateOrganizations([]);
                organizationsStore.setCurrentOrganization(null);
            } finally {
                organizationsStore.setLoading(false);
            }
        });
    }

    return fetchOrganizations;
};
