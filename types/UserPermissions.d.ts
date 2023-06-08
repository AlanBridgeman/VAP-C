import { User } from './User';
import { AccountPermission } from './AccountPermission';

export interface UserPermissions {
    uId?: string,                    // The unique identifier of the user associated with this row
    user?: User,                     // The user associated with this row
    pId?: number,                    // The unique identifier of the permission associated with this row
    permission: AccountPermission,  // The permission associated with this row
    assigned?: Date,                 // When the permission was assigned
    active: boolean                 // Wheither the permission is currently active
}