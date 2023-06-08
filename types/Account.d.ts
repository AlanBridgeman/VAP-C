import { User } from './User';
import { AccountPermission } from './AccountPermission';
import { AccessToServices } from './AccessToService';
import { AccountProperties } from './AccountProperties';

export interface Account {
    id?: string,                        // The unique identifier for the account
    name: string,                       // The name associated with the account
    organization?: string,              // The organization name if accounts should be grouped (specifically for Azure Table Storage records)
    permissions: AccountPermission[],   // The permissions configured in the account
    users?: User[],                     // Users in the account
    services?: AccessToServices[],      // The set of services provided at the account level
    properties: AccountProperties       // The NoSQL properties of the Account
}