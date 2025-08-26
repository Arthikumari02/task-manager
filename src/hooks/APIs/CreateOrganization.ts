import { runInAction } from "mobx";
import { TrelloOrganization } from "../../types";
import { OrganizationModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useOrganizationsStore } from "../../contexts";

export const useCreateOrganization = () => {
    const organizationsStore = useOrganizationsStore();
    
    const createOrganization = async (name: string): Promise<TrelloOrganization | null> => {
        const { token, clientId } = getAuthData();
        if (!token || !clientId) return null;

        runInAction(() => {
            organizationsStore.isCreating = true;
            organizationsStore.error = null;
        });

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

            runInAction(() => {
                // Add the new organization to the existing ones
                organizationsStore.organizations = [...organizationsStore.organizations, orgToAdd];

                // Create OrganizationModel instance
                const orgModel = new OrganizationModel({
                    id: orgToAdd.id,
                    name: orgToAdd.name,
                    displayName: orgToAdd.displayName,
                    desc: orgToAdd.desc,
                    url: orgToAdd.url
                });
                organizationsStore.organizationModels.set(orgToAdd.id, orgModel);

                // Set as current organization
                organizationsStore.setCurrentOrganization(orgToAdd);
            });

            return orgToAdd;

        } catch (error) {
            console.error('Error creating organization:', error);
            runInAction(() => {
                organizationsStore.error = error instanceof Error ? error.message : 'Failed to create organization';
            });
            return null;
        } finally {
            runInAction(() => {
                organizationsStore.isCreating = false;
            });
        }
    };
    
    return { createOrganization, isCreating: organizationsStore.isCreating };
};
