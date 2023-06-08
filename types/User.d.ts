import { AccessToServices } from './AccessToServices';
import { Account } from './Account';
import { UserPermissions } from './UserPermissions';
import { UserProperties } from './UserProperties';

export interface User {
    id?: string,                    // A unique identifier to identify the user (UUID)
    email: string,                  // The user's email address
    services: AccessToServices[],    // The services the user has access to individually
    aId?: string,                   // The ID of the account
    account?: Account,               // The account to which this user belongs
    permissions: UserPermissions[], // The permissions on the account this user has
    properties: UserProperties      // The NoSQL properties of the User
}