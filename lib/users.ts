import { v4 as newUUID } from 'uuid';

import { SupportedLocales } from './locales';
import { getServicesList } from './services';
import { getOrCreateAccount, getAccountPermission } from './accounts';
import { Locale } from '../types/Locale';
import { Service } from '../types/Service';
import { Account } from '../types/Account';
import { AccountPermission } from '../types/AccountPermission';
import { UserPermissions } from '../types/UserPermissions';
import { UserProperties, StandardName, Salutation, PreDefinedPronouns } from '../types/UserProperties';
import { User } from '../types/User';
import { AccessToServices } from '../types/AccessToServices';
import { createOrder } from './orders';

function createUserPermission(permission: AccountPermission, isActive: boolean): UserPermissions {
    const userOwnerPermission: UserPermissions = {
        permission: permission,
        active: isActive
    }

    return userOwnerPermission;
}

function createUserProperties(name: string | StandardName, salutation: Salutation, locale: Locale, pronouns: string | PreDefinedPronouns, avatar: string, stripeCustomerId: string): UserProperties {
    const user_props: UserProperties = {
        name: name,
        salutation: salutation,
        lang: {
            "*": locale.language + '-' + locale.country // * = use for all pages and services
        },
        pronouns: pronouns,
        avatar: avatar,
        stripeId: stripeCustomerId
    };

    return user_props;
}

const createUserObj = (id: string, email: string, services: AccessToServices[], account: Account, user_permissions: UserPermissions[], properties: UserProperties): User => {
    const user: User = {
        id: id,
        email: email,
        services: services,
        account: account,
        permissions: user_permissions,
        properties: properties
    };

    return user;
}

/**
 * Create a pretty initial user for user first creation
 * 
 * @param accountName (string) - The account name
 * @param name (string | StandardName) - The name of the user
 * @param salutation (Salutation) - The salutation to use for the user
 * @param pronouns (string | PreDefinedPronouns) - The pronouns to use for the user
 * @returns User - The created user
 */
export async function createInitialUser(accountName: string, name: string | StandardName, salutation: Salutation, pronouns: string | PreDefinedPronouns) {
    // Get or create the account associated with this account 
    const account: Account = await getOrCreateAccount(accountName);

    // TEMP: Create an owner permission to assign to the newly created user
    const userOwnerPermission: UserPermissions = createUserPermission(getAccountPermission(account, 'Owner'), true);
    const userPermissions: UserPermissions[] = [userOwnerPermission];
    
    // Setup the user properties
    const user_props: UserProperties = createUserProperties(name, salutation, SupportedLocales.english, pronouns, null, null)
    
    // Create the user object itself
    const user: User = createUserObj(
        newUUID(), 
        'abask@live.ca', 
        [
            {
                activated: false,
                order: null,
                service: (await getServicesList())[0],
                properties: null
            }
        ], 
        account, 
        userPermissions, 
        user_props
    );
    
    // Return the newly constructed user object
    return user;
}