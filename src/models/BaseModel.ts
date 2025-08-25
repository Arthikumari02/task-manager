import { makeObservable, observable, action } from 'mobx';

export abstract class BaseModel {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    makeObservable(this, {
      id: observable,
      name: observable,
      setName: action,
      updateName: action
    });
  }

  setName = (newName: string) => {
    this.name = newName;
  };

  abstract updateNameOnServer(newName: string, authData: { token: string; clientId: string }): Promise<boolean>;

  updateName = async (newName: string, authData: { token: string; clientId: string }): Promise<boolean> => {
    const oldName = this.name;
    
    // Optimistic update
    this.setName(newName);

    try {
      const success = await this.updateNameOnServer(newName, authData);
      if (!success) {
        // Revert on failure
        this.setName(oldName);
      }
      return success;
    } catch (error) {
      // Revert on error
      this.setName(oldName);
      console.error(`Error updating ${this.constructor.name} name:`, error);
      return false;
    }
  };
}
