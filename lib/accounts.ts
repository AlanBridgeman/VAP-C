import { v4 as newUUID } from 'uuid';

import { get_db_adapter } from './db';

import { SupportedLocales } from './locales';

import { Description } from '../types/Description';
import { AccountProperties } from '../types/AccountProperties';
import { RightsDefinition } from '../types/RightsDefinition';
import { AccountPermission } from '../types/AccountPermission';
import { Account } from '../types/Account';
import { saveAccountProperties, saveRightsDefinition } from './azure/table-storage';

/**
 * Creates an AccountProperties object with the appropriate values
 * 
 * @param stripeCustomerId (string) - The Stripe Customer ID of the account 
 *                                    (at the account level)
 * @param descriptions (Description[]) - Set of localized description of the 
 *                                       account/organization (entirely 
 *                                       optional property)
 * @returns AccountProperties - The object generated from the provided 
 *                              parameters
 */
export function createAccountProperties(stripeCustomerId?: string, descriptions?: Description[]): AccountProperties {
    const account_props: AccountProperties = {
        stripeId: stripeCustomerId,
        descriptions: descriptions
    }

    return account_props;
}

/**
 * Creates an Account object with the appropriate values
 * 
 * @param id (string) - The ID used for the new account (In most cases this 
 *                      is a newly generated Universally Unique Identifier 
 *                      (UUID))
 * @param name (string) - The name used for the new account
 * @param permissions (AccountPermission[]) - The set of permissions that 
 *                                            exist on the account (
 *                                            IMPORTANT this is the ones 
 *                                            that exists NOT necessarly 
 *                                            that are used)
 * @param properties (AccountProperties) - The AccountProperties object that 
 *                                         should be associated with the 
 *                                         newly created account
 * @returns Account - The object generated from the provided parameters
 */
export function createAccount(id: string, name: string, organization: string, permissions: AccountPermission[], properties: AccountProperties): Account {
    const account: Account = {
        id: id,
        name: name,
        organization: organization,
        permissions: permissions,
        properties: properties
    }

    return account;
}

/**
 * Add a "Owner" permission to the provided account. This is hard coded 
 * because all accounts should have some set of permissions (having no 
 * permissions on an account makes no sense) and the Owner one with all 
 * permissions provides a good starting place for any permissions to be 
 * further created/refined/assigned from there.
 * 
 * @param account (Account) - The account to setup the Owner permission in
 * @return {Account} THe account object provided with the additional owner permission
 */
function addOwnerPermissionToAccount(account: Account): Account {
    // Create a description of the rights we're setting up
    const ownerRightsDescription: Description = {
        locale: SupportedLocales.english,
        value: 'God status of ownership'
    }

    // Setup the actual rights definition itself
    const ownerRights: RightsDefinition = {
        descriptions: [
            ownerRightsDescription
        ],
        permissions: {
            approve: { // Users with this permission can approve things (and change permissions)
                '*': true // Note, the star is meant to represent All/Universal
            },
            change: { // Users with this permission can change settings
                '*': true // Note, the star is meant to represent All/Universal
            },
            act: { // Users with this permission can trigger actions
                "*": true // Note, the star is meant to represent All/Universal
            },
            review: { // Users with this permission can view/see previous actions etc...
                "*": true // Note, the star is meant to represent All/Universal
            }
        }
    }

    // Create the permissions itself
    const ownerPermission: AccountPermission = {
        name: 'Owner',
        rights: ownerRights,
        aId: account.id
    }

    // Add the permission to the provided account
    account.permissions.push(ownerPermission);

    return account;
}

/**
 * Generates a pretty basic/inital account for when accounts are first created
 * 
 * @param name (string) - The name to associate with the account
 * @returns Account - The created account
 */
export function createInitialAccount(name: string): Account {
    // Create a AccountProperties object with minimal arguments (because we 
    // don't know yet)
    const account_props = createAccountProperties();
    
    // Create an Account object with minimal arguments (use an 
    // auto-generated Universally Unique ID (UUID) for the id)
    // 
    // Also, note we set permissions as a empty array here because we don't 
    // have any AccountPermissions defined yet. So, we just add them to the 
    // account in a sequent step
    let account = createAccount(newUUID(), name, name, [], account_props);
    
    // Add the owner permission to the account (see function comment block 
    // for why this makes sense here)
    account = addOwnerPermissionToAccount(account);
    
    return account;
}

/**
 * Get an existing account with the given name OR creates a new one with 
 * the given name
 * 
 * @param name (string) - The name of the account to look up and if it deoesn't exist create
 * @returns Account - The existing or newly created account object
 */
export async function getOrCreateAccount(name: string): Promise<Account> {
    // Check if the account already exists
    let account: Account = await (await get_db_adapter()).findAccountByName(name);
    
    console.log('Found the following account in DB from name: ' + JSON.stringify(account));

    // If the account doesn't already exist create it
    if (account == null) {
        const newAccount = createInitialAccount(name);

        try {
            console.log('Attempting to save account with id to database: ' + newAccount.id);
            console.log('Attempting to save account with name to database: ' + newAccount.name);
            console.log('Attempting to save account with organization to database: ' + newAccount.organization);
            
            if(account == null) {
                // Save the constructed account to the database
                account = await (await get_db_adapter()).saveAccountToDB(newAccount);
            }
        }
        catch(e) {
            // ERROR: Can't save to the database for some reason
            console.log('An Error occured: ' + e)
        }
    }

    return account;
}

export function getAccountPermission(account: Account, permissionName: string): AccountPermission {
    account.permissions.forEach((permission: AccountPermission, index: number) => {
        // Return the first permission that matches the provided name
        if(permission.name === permissionName) {
            return permission;
        }
    });

    // Because it hasn't returned until now assume it doesn't exist and return null
    return null;
}