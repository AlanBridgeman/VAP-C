import { Account } from './Account';
import { UserPermissions } from './UserPermissions';
import { RightsDefinition } from './RightsDefinition';

export interface AccountPermission {
    id?: number,                // A unique identifier to identify the permission
    name: string,               // The name of the permission (to display for ease of use)

    // IMPORTANT: Note, the divergence that I only have the ID here not an 
    //            account object this is so that we don't end up with 
    //            circular dependencies and have trouble passing the object 
    //            around
    aId?: string,               // The ID of the account to which this permission is for
    
    users?: UserPermissions[],  // The Users that have the permission represented by this row
    rights: RightsDefinition    // The actual rights definition itself
}