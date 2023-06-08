import crypto from 'crypto';
import { v4 as newUUID } from 'uuid';
import { Account as DatabaseAccount, User as DatabaseUser } from '@prisma/client';

import { get_db_adapter } from './db';
import { saveAllPropertiesAssociatedWithUser } from './azure/table-storage';
import { getOrCreateAccount } from './accounts';
import { getServicesList } from './services';
import { createOrder } from './orders';
import { createAccessToServices } from './access-to-services';
import { SupportedLocales } from './locales';

import { Account } from '../types/Account';
import { AccountPermission } from '../types/AccountPermission';
import { AccountProperties } from '../types/AccountProperties';
import { AccessToServices } from '../types/AccessToServices';
import { User } from '../types/User';
import { Name, Pronouns, Salutation, UserProperties } from '../types/UserProperties';
import { UserPermissions } from '../types/UserPermissions';
import { Locale } from '../types/Locale';

/**
 * Creates a user in the database. This also creates an account as needed.
 * 
 * @param accountName the account name to look for and associate this user with
 * @param name THe name of the user
 * @param salutation The salutation of the user
 * @param pronouns The pronouns chossen by the user
 * @param email The email of the user
 * @param password The password of the user
 * @param props Other properties provided by the user
 * @returns The user created wit the data provided
 */
 export async function createUser(accountName: string, name: Name, salutation: Salutation, pronouns: Pronouns, email: string, password: string, ...props) {
    // Get the account for the user
    //              OR
    // Create the account for the user
    // 
    // Keeping in mind an account is an object/abstraction above a 
    // user that can hold multiple users depending on circumstance
    const newAccount: Account = await getOrCreateAccount(accountName);
    
    // DEBUGGING: ensure the account information was populated properly
    console.log('Account - ID (createUser): ' + newAccount.id);
    console.log('Account - Name (createUser): ' + newAccount.name);
    console.log('Account - Organization (createUser): ' + newAccount.organization);
    newAccount.permissions.forEach(
        (permission: AccountPermission, index: number) => {
            console.log('Account - Permissions[' + index + '] - ID: ' + permission.id);
            console.log('Account - Permissions[' + index + '] - Name:' + permission.name);
            console.log('Account - Permissions[' + index + '] - Account - ID: ' + permission.aId);
            console.log('Account - Permissions[' + index + '] - Rights: ' + JSON.stringify(permission.rights));
        }
    );
    console.log('Account - Services: ' + JSON.stringify(newAccount.services));
    console.log('Account - Users:' + JSON.stringify(newAccount.users));
    console.log('Account - Properties: ' + JSON.stringify(newAccount.properties));
            
    const services: AccessToServices[] = [];
    
    //===================================
    // FOR TESTING PURPOSES ONLY
    //===================================

    // For each service that exists create an order and asse with  he user
    (await getServicesList()).forEach(
        service => {
            const order = createOrder(new Date(Date.now()), new Date(Date.now()), 0.0, 'System Assigned', 'order123')
            const accessToService: AccessToServices = createAccessToServices(order, service);
            services.push(accessToService);
        }
    );

    //===================================
    // END: FOR TESTING PURPOSES ONLY
    //===================================

    // Create the actual User object
    // 
    // ID: use the v4 functin (aliased as newUUID) in the 
    //     `uuid` third party NPM package (to support RFC4122 
    //     version 4 UUIDs. Which generate a fully random UUID) see 
    //     https://www.npmjs.com/package/uuid for more details on the 
    //     third party package
    // Email: Uses the email provided
    // Services: Keep in mind this is an AccessToServices array (
    //           which is the object that maps users OR accounts to 
    //           a given service) this is because it would be 
    //           wasteful to store all the information about each 
    //           service with each user and it would also make it 
    //           more difficult to change information about services 
    //           as you'd need to go to each user individually and 
    //           update the service information. However, with only 
    //           storing the mapping it provides the correlation 
    //           needed to show things on the interface 
    //           appropraitely etc... while still giving 
    //           flexibility to update service information etc...
    //           
    //           For developing/testing purposes this is set to 
    //           just assign all the service mappings to the user 
    //           this is just for ease of developing/testing
    // Account: Where a user maps one-to-one with an individual an 
    //          account maps one-to-one with a function/content unit. 
    //          That is, an account is designed to group people 
    //          together who function as a team to complete one task 
    //          or who all work on the same content, have different 
    //          responsibilities etc... In short, if more than one 
    //          person needs to access the content than more than 
    //          one person should be on the account
    //          
    //          One thing to keep in mind, not implemented here yet, 
    //          is that there will likely be an approval process to 
    //          join an exising account. It als sems likely, from a 
    //          legal side that there may be a need for some kind of 
    //          "valiation" system so that the people with official 
    //          names are really from where they claim (especially 
    //          because we let people use account name)
    // User Permissions: This provides the definition of the rights 
    //                   the user has to perform certain actions etc... 
    //                   What rights are available is dictated by the 
    //                   Account and how it's configured
    // Properties: Provies the container for optional or flexible 
    //             parts of the user's profile etc... That is things 
    //             like pronouns they use which could be one of a 
    //             preconfigured set or could be a value of their 
    //             own choosing (note that for this, there is value 
    //             with the preconfigured set of being able to use 
    //             the proper pronouns in the proper places where a 
    //             provided value is just used everywhere but does 
    //             provide that option for people who don't 
    //             identify within preconfigured set)
    const newUser: User = createUserObj(
        newUUID(), 
        email, 
        services, 
        newAccount, 
        [
            createUserPermission(
                newAccount.permissions[0], 
                true
            )
        ], 
        createUserProperties(
            name,
            salutation,
            SupportedLocales.english,
            pronouns,
            null,
            null
        )
    )

    //stringifyUser(newUser, 'To Be Saved');

    // If you look into this code it may seem like this is out of order 
    // because the saveUserToDB does try to retrieve the properties 
    // from Azure while reconstructing the internal User object. However, 
    // because many of the IDs used to save the properties are generated 
    // by the database itself this is actually intentional which is why 
    // there is a backup value given
    const newDBUser: User = await (await get_db_adapter()).saveUserToDB(newUser, password);
    //console.log('Attempting to save properties for: ' + JSON.stringify(newDBUser));
    await saveAllPropertiesAssociatedWithUser(newDBUser);

    stringifyUser(newDBUser, 'Added User');

    // Filter the provided extra properites by prefix
    //const accountProps = getPrefixedProps('account-', props);
    //const userProps = getPrefixedProps('user-', props);
    
    // Creat the user's properties
    //const entity = {};//createUserProps(newUser, userProps);
  
    //const sessionUser: SessionUser = merge(newUser, userProps);
  
    //return sessionUser;

    return newDBUser
}

const createUserPermission = (permission: AccountPermission, isActive: boolean): UserPermissions => {
    const userOwnerPermission: UserPermissions = {
        permission: permission,
        active: isActive
    }

    return userOwnerPermission;
}

const createUserProperties = (name: Name, salutation: Salutation, locale: Locale, pronouns: Pronouns, avatar: string, stripeCustomerId: string): UserProperties => {
    const user_props: UserProperties = {
        name: name,
        salutation: salutation,
        lang: {
            "*": locale.language + '-' + locale.country
        },
        pronouns: pronouns,
        avatar: avatar,
        stripeId: stripeCustomerId
    };

    return user_props;
}

/**
 * Convenience method for creating the user object
 * 
 * @param id The user's ID
 * @param email The user's email
 * @param services The AccessToServices array with the mappings to services
 * @param account The account associated with this ser
 * @param user_permissions The user's permissions
 * @param properties The user's properties
 * @returns The created user object
 */
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
 * Easy way to print/debug the user's contents (witout getting into circular dependencies/infinite loops)
 * 
 * @param user The user being inspected/printed
 * @param func_name The function name for easier legibility of output
 */
export function stringifyUser(user: User, func_name: string) {
    console.log('User - ID (' + func_name + '): ' + user.id);
    console.log('User - Email (' + func_name + '): ' + user.email);
    console.log('User - Account - ID (' + func_name + '): ' + user.account.id);
    console.log('User - Account - Name (' + func_name + '): ' + user.account.name);
    console.log('User - Account - Organization (' + func_name + '): ' + user.account.organization);
    user.account.permissions.forEach((permission: AccountPermission, index: number) => {
        console.log('User - Account - Permissions[' + index + '] - ID (' + func_name + '): ' + permission.id);
        console.log('User - Account - Permissions[' + index + '] - Name (' + func_name + '):' + permission.name);
        console.log('User - Account - Permissions[' + index + '] - Account - ID (' + func_name + '): ' + permission.aId);
        console.log('User - Account - Permissions[' + index + '] - Rights (' + func_name + '): ' + JSON.stringify(permission.rights));
    });
    console.log('User - Account - Services (' + func_name + '): ' + JSON.stringify(user.account.services));
    console.log('User - Account - Properties (' + func_name + '): ' + JSON.stringify(user.account.properties));
    console.log('User - Permissions (' + func_name + '): ' + JSON.stringify(user.permissions));
    user.permissions.forEach((permissions: UserPermissions, index: number) => {
        console.log("User - Permissions[" + index + "] - Active: " + permissions.active);
        console.log("User - Permissions[" + index + "] - Assigned: " + permissions.assigned);
        console.log("User - Permissions[" + index + "] - Permission - ID: " + permissions.permission.id)
        console.log("User - Permissions[" + index + "] - permission - Name: " + permissions.permission.name)
        console.log("User - Permissions[" + index + "] - Permission - Rights: " + JSON.stringify(permissions.permission.rights));
    });
    
    //console.log('User - Services (' + func_name + '): ' + JSON.stringify(user.services));
    //console.log('User - Properties (' + func_name + '): ' + JSON.stringify(user.properties));
}