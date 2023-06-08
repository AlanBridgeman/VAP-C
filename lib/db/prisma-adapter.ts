/*
 *************************************************************
 * Name: prisma-adapter.ts (Database Access via Prisma)
 * Description: Provide a functionality oriented abstraction 
 *              above the database access provided by Prisma
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import crypto from 'crypto'
import { v4 as newUUID } from 'uuid';
import merge from 'lodash.merge';
import DBAdapter from './db-adapter';
import Prisma from '../prisma';
import { stringifyUser } from '../user';
import {
    retrieveAccountProperties,
    retrieveRightsDefinition,
    retrieveOrderProperties,
    retrieveServiceCategoryProperties,
    retrievePriceProperties,
    retrieveServiceProperties,
    retrieveAccessProperties,
    retrieveUserProperties
} from '../azure/table-storage';
import { 
    Account as PrismaAccount, 
    User as PrismaUser,
    AccountPermission as PrismaAccountPermission,
    UserPermissions as PrismaUserPermissions, 
    AccessToServices as PrismaAccessToServices,
    Order as PrismaOrder,
    Service as PrismaService, 
    ServiceCategory as PrismaServiceCategory,
    Price as PrismaPrice,
    Prisma as PrismaClient
} from '@prisma/client';
import { User } from '../../types/User';
import { Account } from '../../types/Account';
import { AccountPermission } from '../../types/AccountPermission';
import { AccessToServices } from '../../types/AccessToServices';
import { AccessToServicesProperties, AccessToServicesType } from '../../types/AccessToServicesProperties';
import { Order } from '../../types/Order';
import { Service } from '../../types/Service';
import { ServiceCategory } from '../../types/ServiceCategory';
import { Price } from '../../types/Price';
import { UserPermissions } from '../../types/UserPermissions';
import { AccountProperties } from '../../types/AccountProperties';
import { UserProperties } from '../../types/UserProperties';
import { PriceProperties } from '../../types/PriceProperties';
import { ServiceProperties } from '../../types/ServiceProperties';
import { ServiceCategoryProperties } from '../../types/ServiceCategoryProperties';
import { OrderProperties } from '../../types/OrderProperties';
import { RightsDefinition } from '../../types/RightsDefinition';
import { PrismaClientInitializationError } from '@prisma/client/runtime';

// Create type simplifications (Give names to complex types)
type CompletePrismaService = PrismaService & {category: PrismaServiceCategory, prices: PrismaPrice[]};
type CompletePrismaAccessToServices = PrismaAccessToServices & {order: PrismaOrder, service: CompletePrismaService};
//type CompletePrismaAccount = PrismaAccount & {permissions: PrismaAccountPermission[], services: CompletePrismaAccessToServices[]}
// Note, that the CompletePrismaAccount doesn't force users, 
// permissions or services to be specified. This is important because 
// we dynamically generate the include part so forcing the type would 
// create an error    
type CompletePrismaAccount = PrismaAccount & {users?: CompletePrismaUser[], permissions?: PrismaAccountPermission[], services?: PrismaAccessToServices[]};
type CompletePrismaUserPermissions = PrismaUserPermissions & {permission: PrismaAccountPermission};
type CompletePrismaUser = {id: string, email: string, account: CompletePrismaAccount, permissions: CompletePrismaUserPermissions[], services: CompletePrismaAccessToServices[]};

type AccountConnector = {connect: {id: string}} | PrismaClient.AccountCreateNestedOneWithoutUsersInput;

export default class PrismaAdapter implements DBAdapter {
    readonly standardUserSelect = {
        id: true,
        email: true,
        account: {
            include: {
                permissions: true,
                services: {
                    include: {
                        order: true,
                        service: {
                            include: {
                                category: true,
                                prices: true
                            }
                        }
                    }
                }
            }
        },
        permissions: {
            include: {
                permission: true
            }
        },
        services: {
            include: {
                order: true,
                service: {
                    include: {
                        category: true,
                        prices: true
                    }
                }
            }
        }
    };
    
    /**
     * Get all the users associated with the given account
     * 
     * @param id (string) - The id of the account to get the users for
     * @returns User[] - The list of users (in internal user representation format)
     */
    async getUsersInAccount(id: string): Promise<User[]> {
        type CompletePrismaUserPermissions = PrismaUserPermissions & {permission: PrismaAccountPermission}
        type CompletePrismaService = PrismaService & {category: PrismaServiceCategory, prices: PrismaPrice[]}
        type CompletePrismaAccessToServices = PrismaAccessToServices & {order: PrismaOrder, service: CompletePrismaService}
        type CompletePrismaUser = PrismaUser & { permissions: CompletePrismaUserPermissions[], services: CompletePrismaAccessToServices[]}
        type CompletePrismaAccount = PrismaAccount & { users: CompletePrismaUser[]}
        
        // Query the database for the desired results
        const account: CompletePrismaAccount = await Prisma.account.findUnique(
            {
                where: {
                    id: id
                },
                include: {
                    users: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            },
                            services: {
                                include: {
                                    order: true,
                                    service: {
                                        include: {
                                            category: true,
                                            prices: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        )
        
        const returnedUsers: User[] = account.users.map(
            (user: CompletePrismaUser, index: number) => {
                // Convert the database record into the internal representation
                const internalUser: User = {
                    id: user.id,
                    email: user.email,
                    aId: user.aId,
                    //account: account,
                    permissions: user.permissions.map(
                        (dbUserPermission: CompletePrismaUserPermissions, index: number): UserPermissions => {
                            const accountPermission: AccountPermission = {
                                id: dbUserPermission.permission.id,
                                name: dbUserPermission.permission.name,
                                rights: null
                            };
                            
                            const userPermission: UserPermissions = {
                                active: dbUserPermission.active,
                                permission: accountPermission,
                                assigned: dbUserPermission.assigned
                            }
                            
                            return userPermission;
                        }
                    ),
                    services: user.services.map(
                        (dbAccessToServices: CompletePrismaAccessToServices, index: number): AccessToServices => {
                            const order: Order = {
                                id: dbAccessToServices.order.id,
                                placed: dbAccessToServices.order.placed,
                                paid: dbAccessToServices.order.paid,
                                total: dbAccessToServices.order.total,
                                properties: null
                            }
                            
                            const serviceCategory: ServiceCategory = {
                                id: dbAccessToServices.service.category.id,
                                grouping: dbAccessToServices.service.category.grouping,
                                properties: null
                            }
                            
                            const service: Service = {
                                id: dbAccessToServices.service.id,
                                category: serviceCategory,
                                prices: dbAccessToServices.service.prices.map(
                                    (dbPrice: PrismaPrice, index: number): Price => {
                                        const price: Price = {
                                            id: dbPrice.id,
                                            currency: dbPrice.currency,
                                            value: dbPrice.value,
                                            properties: null
                                        }
                                        
                                        return price;
                                    }
                                ),
                                properties: null
                            }
                            
                            const accessToServices: AccessToServices = {
                                activated: dbAccessToServices.activated,
                                activeDate: dbAccessToServices.activeDate,
                                order: order,
                                service: service,
                                properties: null
                            }
                            
                            return accessToServices;
                        }
                    ),
                    properties: null
                }
                
                // Add the newly constructed internal represenation of the user to 
                // the result set
                return internalUser;
            }
        );
        
        return returnedUsers;
    }
    
    /**
     * Helper function to filter properties based on a given prefix such as 
     * user- or account- etc...
     * 
     * @param prefix 
     * @param props 
     * @returns 
     */
    private getPrefixedProps(prefix: string, props: { [x: string]: any }) {
        // Find all property's names that start with the given prefix
        var filteredPropNames = Object.keys(props).filter((prop) => new RegExp(prefix).test(prop));
        
        // Create a list to hold the properties that we're looking for
        const filteredProps = {};
        
        // Go over the list of matching property names and add them to the list
        filteredPropNames.forEach(
            (prop_name: string, index: number) => {
                filteredProps[prop_name.substring(prop_name.indexOf(prefix) + prefix.length)] = props[prop_name];
            }
        );
        
        // Return the newly generated list
        return filteredProps;
    }
    
    /**
     * Save an internal Account object into the database as transparently as possible (that is making as little 
     * changes as possible).
     * 
     * @param account (Account) - The internal representation of the account to 
     *                            create in the database
     * @returns Account - The internal representation having been saved to the 
     *                    database
     */
    async saveAccountToDB(account: Account): Promise<Account> {
        // Because the database write could fail AND we want to fail gracefully setting up the variable ahead of the 
        // try-catch is the easiest especially, in terms future prrofing for an implement of backup logic later
        let dbAccount: CompletePrismaAccount = null;
        
        // While the connectors below allow for specifying/linking records in other tables during the creation phase
        // This specifies what, other than the base Account record, also gets returned in terms of related records 
        // from the creation
        const includeParam: PrismaClient.AccountInclude = {
            permissions: false,
            services: false,
            users: false
        };
        
        try {
            let permissionConnectors: PrismaClient.AccountPermissionCreateNestedManyWithoutAccountInput = null;
            
            // Check to ensure the are actual AccessToServies records to iterate over otherwise don't bother
            if(account.permissions != null && account.permissions.length > 0) {
                // Create the AccountPermissions if they don't already exist
                permissionConnectors = { // Because there can be many connectors a container to hold them
                    create: account.permissions.map( // Get a connector for each permission that exists on the provided Account object
                        (permission: AccountPermission, index: number): PrismaClient.AccountPermissionCreateWithoutAccountInput => { // Function to actually generate the connector
                            const permissionConnector: PrismaClient.AccountPermissionCreateWithoutAccountInput = { // Connector for the permission itself
                                name: permission.name
                            };
                            
                            // Return the connector
                            return permissionConnector;
                        } // END of generator function
                    ) // END of object parameter
                }; // END of container
                
                // Include AccountPermissions in whats returned from the creation invocation
                includeParam['permissions'] = true;
            } // END of null and some elements check
            
            let accessToServicesConnectors: PrismaClient.AccessToServicesCreateNestedManyWithoutAccountInput = null;
            
            // Check to ensure the are actual AccessToServies records to iterate over otherwise don't bother
            if(account.services != null && account.services.length > 0) {
                // Create the AccessToServices records if they don't already exist
                accessToServicesConnectors = { // Because there can be many connectors a container to hold them
                    connectOrCreate: account.services.map( // Get a connector for each AccessToServices that exists on the provided Account object
                        (accessToService: AccessToServices, index: number): PrismaClient.AccessToServicesCreateOrConnectWithoutAccountInput => { // Function to actually generate the connector
                            // Create a connector to create the Order record if it doesn't exist
                            const orderConnector: PrismaClient.OrderCreateOrConnectWithoutAccessesInput = { // Connector for the order associated with the AccessToServices record
                                create: { // How to create the Order record if it doesn't exist
                                    placed: accessToService.order.placed,
                                    paid: accessToService.order.paid,
                                    total: accessToService.order.total
                                },
                                where: { // How to check if the Order already exists
                                    id: accessToService.order.id
                                }
                            };
                            
                            // Create a connector to create the Service Cateogry record if it doesn't exist
                            const serviceCategoryConnector: PrismaClient.ServiceCategoryCreateOrConnectWithoutMembersInput = { // Connector for the Service Category associated with the Service associated with the AccessToServices record
                                create: { // How to create the Service Category record if it doesn't exist
                                    grouping: accessToService.service.category.grouping
                                },
                                where: { // How to check if the Service Category already exists
                                    id: accessToService.service.category.id
                                }
                            }
                            
                            // Create the Price records if they don't already exist
                            const priceConnectors: PrismaClient.PriceCreateNestedManyWithoutServiceInput = { // Because there can be many connectors a container to hold them
                                connectOrCreate: accessToService.service.prices.map( //Get a connector for each Price associated with the Service that's associated with the AccessToServices record
                                    (price: Price, index: number): PrismaClient.PriceCreateOrConnectWithoutServiceInput => { // Function to actually generatethe the connector
                                        const priceConnector: PrismaClient.PriceCreateOrConnectWithoutServiceInput = { // Connector for the Price itself
                                            create: { // How to create Price reocrd if it doesn't exist
                                                value: price.value,
                                                currency: price.currency,
                                            },
                                            where: { // How to check if the Price already exists
                                                id: price.id
                                            }
                                        };
                                        
                                        // Return the connector
                                        return priceConnector;
                                    } // END of generator function
                                ) // END of object parameter
                            }; // END of container
                            
                            const serviceConnector: PrismaClient.ServiceCreateOrConnectWithoutCustomersInput = { // Connector for the Service associated with the AccessToServices record
                                create: { // How to create the Service record if it doesn't exist
                                    category: serviceCategoryConnector,
                                    prices: priceConnectors,
                                },
                                where: { // How to check if the Service already exists
                                    id: accessToService.service.id
                                }
                            }
                            
                            let id: PrismaClient.AccessToServicesSIdOIdCompoundUniqueInput = null;
                            
                            // Only generate the composite ID if we actually can
                            if(accessToService.order.id != null && accessToService.service.id != null) {
                                // Because AccessToServices records have a composite Primary Key. We need to generate one to 
                                // check against for checking if the record already exists.
                                id = { 
                                    oId: accessToService.order.id,
                                    sId: accessToService.service.id
                                }
                            }
                            
                            const accessToServicesConnector: PrismaClient.AccessToServicesCreateOrConnectWithoutAccountInput = {
                                create: { // How to create the AccessToService record if it doesn't exist
                                    activated: accessToService.activated,
                                    activeDate: accessToService.activeDate,
                                    expiry: accessToService.expiry,
                                    order: orderConnector,
                                    service: serviceConnector
                                },
                                where: { // How to check if the AccessToServices record already exists
                                    sId_oId: id
                                }
                            };
                            
                            // Return the connector
                            return accessToServicesConnector;
                        } // END of the generator function
                    ) // END of object parameter
                } // END of container
                
                // Include AccessToServices records in whats returned from the creation invocation
                includeParam['services'] = true;
            } // END of null and some elements check
            
            let userConnectors: PrismaClient.UserCreateNestedManyWithoutAccountInput = null;
            
            // Check to ensure the are actual AccessToServies records to iterate over otherwise don't bother
            if(account.users != null && account.users.length > 0) {
                // Create the User records if they don't already exist
                userConnectors = { // Because there can be many connectors a container to hold them
                    connectOrCreate: account.users.map( // Get a connector for each User that exists on the provided Account object
                        (user: User, index: number): PrismaClient.UserCreateOrConnectWithoutAccountInput => { // Function to actually generate the connector
                            // Note, I do this here so that I can override it later dynamically as I need to include deeper relations
                            includeParam['users'] = true;
                            
                            let accessToServicesConnectors: PrismaClient.AccessToServicesCreateNestedManyWithoutAccountInput = null;
                            
                            // Check to ensure the are actual AccessToServies records to iterate over otherwise don't bother
                            if(user.services != null && user.services.length > 0) {
                                // Create the AccessToServices records if they don't already exist
                                accessToServicesConnectors = { // Because there can be many connectors a container to hold them
                                    connectOrCreate: user.services.map( // Get a connector for each AccessToServices that exists on the provided Account's User objects
                                        (accessToServices: AccessToServices, index: number): PrismaClient.AccessToServicesCreateOrConnectWithoutAccountInput => { // Function to actually generate the connector
                                            // Create a connector to create the Order record if it doesn't exist
                                            const orderConnector: PrismaClient.OrderCreateOrConnectWithoutAccessesInput = { // Connector for the order associated with the AccessToServices record
                                                create: { // How to create the Order record if it doesn't exist
                                                    total: accessToServices.order.total,
                                                    paid: accessToServices.order.paid,
                                                    placed: accessToServices.order.placed
                                                },
                                                where: { // How to check if the Order already exists
                                                    id: accessToServices.order.id
                                                }
                                            }
                                            
                                            // Create a connector to create the Service Cateogry record if it doesn't exist
                                            const serviceCategoryConnector: PrismaClient.ServiceCategoryCreateOrConnectWithoutMembersInput = { // Connector for the Service Category associated with the Service associated with the AccessToServices record
                                                create: { // How to create the Service Category record if it doesn't exist
                                                    grouping: accessToServices.service.category.grouping
                                                },
                                                where: { // How to check if the Service Category already exists
                                                    id: accessToServices.service.category.id
                                                }
                                            }
                                            
                                            // Create the price records if they don't already exist
                                            const priceConnectors: PrismaClient.PriceCreateNestedManyWithoutServiceInput = { // Because there can be many connectors a container to hold them
                                                connectOrCreate: accessToServices.service.prices.map( //Get a connector for each Price associated with the Service that's associated with the AccessToServices record
                                                    (price: Price, index: number): PrismaClient.PriceCreateOrConnectWithoutServiceInput => { // Function to actually generatethe the connector
                                                        const priceConnector: PrismaClient.PriceCreateOrConnectWithoutServiceInput = { // Connector for the Price itself
                                                            create: { // How to create Price reocrd if it doesn't exist
                                                                value: price.value,
                                                                currency: price.currency
                                                            },
                                                            where: { // How to check if the Price already exists
                                                                id: price.id
                                                            }
                                                        }
                                                        
                                                        // Return the connector
                                                        return priceConnector;
                                                    } // END of generator function
                                                ) // END of object parameter
                                            } // END of container
                                            
                                            const serviceConnector: PrismaClient.ServiceCreateOrConnectWithoutCustomersInput = { // Connector for the Service associated with the AccessToServices record
                                                create: { // How to create the Service record if it doesn't exist
                                                    category: serviceCategoryConnector,
                                                    prices: priceConnectors
                                                },
                                                where: { // How to check if the Service already exists
                                                    id: accessToServices.service.id
                                                }
                                            }
                                            
                                            let id: PrismaClient.AccessToServicesSIdOIdCompoundUniqueInput = null;
                                            
                                            // Only generate the composite ID if we actually can
                                            if(accessToServices.order.id != null && accessToServices.service.id != null) {
                                                // Because AccessToServices records have a composite Primary Key. We need to generate one to 
                                                // check against for checking if the record already exists.
                                                id = {
                                                    oId: accessToServices.order.id,
                                                    sId: accessToServices.service.id
                                                }
                                            }
                                            
                                            const accessToServicesConnector: PrismaClient.AccessToServicesCreateOrConnectWithoutAccountInput = {
                                                create: { // How to create the AccessToService record if it doesn't exist
                                                    activated: accessToServices.activated,
                                                    activeDate: accessToServices.activeDate,
                                                    expiry: accessToServices.expiry,
                                                    order: orderConnector,
                                                    service: serviceConnector
                                                },
                                                where: { // How to check if the AccessToServices record already exists
                                                    sId_oId: id
                                                }
                                            }
                                            
                                            // Because I know the user defines services include those in the output of account creat output
                                            includeParam['users'] = {
                                                select: this.standardUserSelect
                                            };
                                            
                                            // Return the connector
                                            return accessToServicesConnector;
                                        } // END of generator function
                                    ) // END of object parameter
                                }; // END of container
                            } // END of null and some elements check
                            
                            // Because these users are being added at the same time as account creation give them a 
                            // random password (work on a admin password reset functionality later so that a admin can 
                            // just go in and reset the password for these accounts)
                            const salt = crypto.randomBytes(16).toString('hex')
                            const hash = crypto.pbkdf2Sync(crypto.randomUUID(), salt, 1000, 64, 'sha512').toString('hex')
                            
                            // Note, UserPermissions for any User created here CAN'T be specified here. This is because 
                            // of the linkage between UserPermissions and AccountPermissions which links back to the 
                            // account which isn't defined yet (and the purpose of the overarching function).
                            const userConnector: PrismaClient.UserCreateOrConnectWithoutAccountInput = {
                                create: {
                                    id: user.id,
                                    email: user.email,
                                    salt: salt,
                                    password: hash,
                                    services: accessToServicesConnectors
                                },
                                where: {
                                    id: user.id
                                }
                            };
                            
                            // Return the connector
                            return userConnector;
                        } // End of generator function
                    ) // END of object parameter
                } // END of container
            } // END of null and some elements check
            
            const dbAccountCreateArgs: PrismaClient.AccountCreateArgs = {
                data: { // How to actually create the Account record itself
                    id: account.id ? account.id : newUUID(),
                    name: account.name,
                    organization: account.organization,
                    permissions: permissionConnectors,
                },
                include: includeParam // Whats included as output from this call (outside the base Account record)
            }
            
            if(accessToServicesConnectors != null) {
                dbAccountCreateArgs.data.services = accessToServicesConnectors;
            }
            
            // Add the provided account to the database
            dbAccount = await Prisma.account.create(dbAccountCreateArgs);
        }
        catch(e) {
            // ERROR: the insertion failed should do something accordingly (to-do)
            console.log('An error occured: ' + e);
        }
        
        // Only do further stuff if the create actually worked
        if(dbAccount != null) {
            const returnedAccount: Account = await this.reconstructAccountFromDBAccount(dbAccount, includeParam, account);
            
            console.log("Account Return From Save ID: " + returnedAccount.id);
            console.log("Account Return From Save Name: " + returnedAccount.name);
            console.log("Account Return From Save Organization: " + returnedAccount.organization);
            
            // Return the internal representation we constructed from the 
            // returned database entry we created
            return returnedAccount;
        }
        
        // Return null if something went wrong
        return null;
    }
    
    /**
     * Saves the internal user representation to the database.
     * 
     * It's important to note this DOESN'T save the User's properties (
     * NoSQL record) but rather simply copies them this is important 
     * because these are stored and retrieved seperately and by decoupling 
     * the two it means things like order or timing of the retrival and 
     * other operations is removed or lessened from consideration.
     * 
     * @param user (User) - The internal representation of the user to be added to the database
     * @param password (string) - Note, that because we want to avoid passwords 
     *                            locally as much as possible we don't have a 
     *                            password property on the internal user 
     *                            representation which means we have to pass 
     *                            this seperately
     * @returns User - The internal user representation of the user added to the database
     */
    async saveUserToDB(user: User, password: string): Promise<User> {
        // Here you should create the user and save the salt and hashed password 
        // (some dbs may have authentication methods that will do it for you so 
        // you don't have to worry about it):
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        
        let newUser: CompletePrismaUser = null;
        
        let newUserId: string = user.id ? user.id : newUUID();
        
        try {
            const accountConnector: AccountConnector = await this.createAccountConnector(user);
            const permissionConnectors: PrismaClient.UserPermissionsCreateNestedManyWithoutUserInput = this.creatUserPermissionsConnectors(user, accountConnector);
            const accessToServicesConnectors: PrismaClient.AccessToServicesCreateNestedManyWithoutUserInput = this.createAccessToServicesConnectors(user);
            
            // Insert the newly construct object into the database
            newUser = await Prisma.user.create(
                {
                    data: {
                        id: newUserId,
                        email: user.email,
                        password: hash,
                        salt: salt,
                        account: accountConnector,
                        permissions: permissionConnectors,
                        services: accessToServicesConnectors
                    },
                    select: this.standardUserSelect
                }
            );
            
            console.log('The new users: ' + JSON.stringify(newUser));
        }
        catch(e) {
            // ERROR: the insertion failed should do something accordingly (to-do)
            console.error(e);
        }
        
        if(newUser != null) {
            // Because I used to return the database representation but if that's 
            // done we have to make sure we're not passing around the password and 
            // salt unneccessarly
            // 
            // Explicitly delete the password and salt as we know we don't want to 
            // store thesse values client side
            //delete newUser.password;
            //delete newUser.salt;
            const types: AccessToServicesType[] = [];
            user.services.forEach(
                (accessToServices: AccessToServices, index: number) => {
                    types.push(accessToServices.properties.type);
                }
            );
            
            // Convert the newly created database representation of the user back into 
            // our internal representation
            const returnedUser: User = await this.reconstructUserFromDBUser(newUser, types, user);
            
            return returnedUser;
        }
        
        // If for whatever reason an error occurs or something
        return null;
    }
    
    private async createAccountConnector(user: User): Promise<AccountConnector> {
        const count = await Prisma.account.count({
            where: {
                id: user.account.id
            }
        });
        
        console.log('The count of accounts with same ID: ' + count);
        
        let accountConnector: AccountConnector = null;
        
        if(count == 0) {
            accountConnector = {
                create: {
                    id: user.account.id,
                    name: user.account.name,
                    organization: user.account.organization
                },
            };
        }
        else {
            accountConnector = {
                connect: {
                    id: user.account.id
                }
            }
        }
        
        console.log('Account Connector: ' + JSON.stringify(accountConnector));
        
        return accountConnector;
    }
    
    private creatUserPermissionsConnectors(user: User, accountConnector: AccountConnector): PrismaClient.UserPermissionsCreateNestedManyWithoutUserInput {
        let permissionConnectors: PrismaClient.UserPermissionsCreateNestedManyWithoutUserInput = {};
        
        if(typeof user.permissions !== 'undefined' && user.permissions !== null && user.permissions.length > 0) {
            permissionConnectors = {
                create: user.permissions.map(
                    (userPermissions: UserPermissions, index: number) => this.createUserPermissionsConnector(userPermissions, accountConnector)
                )
            };
            
            console.log('Permissions Connector: ' + JSON.stringify(permissionConnectors))
        }
        
        return permissionConnectors;
    }
    
    private createUserPermissionsConnector(permission: UserPermissions, accountConnector: object): PrismaClient.UserPermissionsCreateWithoutUserInput {
        let accountPermissionConnector: {
            connect: {
                id: number
            }
        } | PrismaClient.AccountPermissionCreateNestedOneWithoutUsersInput;
        
        // Technically it shouldn't really be feasible for this state to occur but I've come accross it so I check
        if(typeof permission.permission !== 'undefined' && permission.permission !== null) {
            // Check if the id of their permission is set than connect to the existing DB record if not create
            if(typeof permission.permission.id !== 'undefined' && permission.permission.id !== null) {
                accountPermissionConnector = {
                    connect: {
                        id: permission.permission.id
                    }
                };
            }
            else {
                accountPermissionConnector = {
                    create: {
                        name: permission.permission.name,
                        account: accountConnector
                    }
                };
            }
        }
        
        console.log('Account Permission Connector: ' + JSON.stringify(accountPermissionConnector));
        
        const permissionConnector: PrismaClient.UserPermissionsCreateWithoutUserInput = {
            active: permission.active,
            permission: accountPermissionConnector ? accountPermissionConnector : null,
            assigned: permission.assigned,
        };
        
        return permissionConnector;
    }
    
    private createAccessToServicesConnectors(user: User): PrismaClient.AccessToServicesCreateNestedManyWithoutUserInput {
        let accessToServicesConnectors: PrismaClient.AccessToServicesCreateNestedManyWithoutUserInput = null;
        
        if(user.services != undefined && user.services != null) {
            accessToServicesConnectors = {
                create: user.services.map(this.createAccessToServicesConnector)
            };
        }
        
        return accessToServicesConnectors;
    }
    
    private createAccessToServicesConnector(accessToServices: AccessToServices, index: number): PrismaClient.AccessToServicesCreateWithoutUserInput {
        const serviceCategoryConnector: PrismaClient.ServiceCategoryCreateNestedOneWithoutMembersInput = {
            create: {
                id: accessToServices.service.category.id,
                grouping: accessToServices.service.category.grouping
            }
        };
        
        const priceConnectors: PrismaClient.PriceCreateNestedManyWithoutServiceInput = {
            connectOrCreate: accessToServices.service.prices.map(
                (price: Price, index: number): PrismaClient.PriceCreateOrConnectWithoutServiceInput => {
                    const priceConnector: PrismaClient.PriceCreateOrConnectWithoutServiceInput = {
                        create: {
                            id: price.id,
                            value: price.value,
                            currency: price.currency
                        },
                        where: {
                            id: accessToServices.service.prices[index].id
                        }
                    }
                    
                    return priceConnector;
                }
            )
        };
        
        const serviceConnector: PrismaClient.ServiceCreateNestedOneWithoutCustomersInput = {
            connectOrCreate: {
                create: {
                    category: serviceCategoryConnector,
                    prices: priceConnectors
                },
                where: {
                    id: accessToServices.service.id
                }
            }  
        };
        
        const orderConnector: PrismaClient.OrderCreateNestedOneWithoutAccessesInput = {
            create: {
                total: accessToServices.order.total
            }
        };
        
        const accessToServicesConnector: PrismaClient.AccessToServicesCreateWithoutUserInput = {
            order: orderConnector,
            service: serviceConnector
        }
        
        return accessToServicesConnector;
    }
    
    /**
     * Attempt to find the account in the database by the name provided
     * 
     * @param name (string) - The name of the account to find in the database
     * @return Account - The internal representation of the account found in the database
     */
    async findAccountByName(name: string): Promise<Account> {
        let dbAccount = null;
        
        try {
            // Query the database to try to get the account from it
            dbAccount = await Prisma.account.findUnique(
                {
                    where: {
                        name: name
                    }
                }
            );
        }
        catch(e) { 
            // Do nothing on DB error (act as though nothing was returned)
        }
        
        // Make sure we got a record back from the database
        if(dbAccount != null) {
            // Convert the returned database Account representation to our internal one
            const account: Account = {
                id: dbAccount.id,
                name: dbAccount.name,
                organization: dbAccount.organization,
                permissions: [],
                properties: {}
            }
            
            return account;
        }
        
        // Technically, this could probably be an else clause as well but this 
        // way it's slightly more resliant to weird unexpected issues
        return null;
    }
    
    /**
     * Find the user in the dabase by User ID
     * 
     * @param id (string) - The ID of the user to get from the database
     * @param callback (Function(error: any, user: User|null)) - The callback to call with the results
     * 
     * @return N/A (void) - Uses a callback instead
     */
    async findUserByUID(id: string, callback: (err: any, user?: User) => void): Promise<void> {
        try {
            const dbUser: CompletePrismaUser = await Prisma.user.findUnique(
                {
                    where: {
                        id: id
                    },
                    select: this.standardUserSelect
                }
            );
            
            const types: AccessToServicesType[] = [];
            dbUser.services.forEach(
                (accessToServices: CompletePrismaAccessToServices, index: number) => {
                    types.push('individual');//accessToServices.properties.type);
                }
            );
            
            // Convert the newly updated database record into the internal 
            // representation of users
            const user: User = await this.reconstructUserFromDBUser(dbUser, types);
            
            console.log('Got user: ' + JSON.stringify(user));
            
            callback(null, user);
        }
        catch(e) {
            callback(e, null)
        }
    }
    
    /**
     * Find the user in the dabase by email
     * 
     * @param email (string) - The email of the user to find
     * @param callback (Function(error: any, user: User|null)) - The callback to call
     * @return N/A (void) - Uses a callback instead
     */
    async findUserByEmail(email: string, callback: (err: any, user?: User) => void): Promise<void> {
        console.log('findUserByEmail is being called with: ' + email);
        
        try {
            const dbUser: CompletePrismaUser = await Prisma.user.findUnique(
                {
                    select: this.standardUserSelect,
                    where: {
                        email: email
                    }
                }
            );
            
            console.log("Prisma returned response: " + JSON.stringify(dbUser));
            
            const types: AccessToServicesType[] = [];
            dbUser.services.forEach(
                (accessToServices: CompletePrismaAccessToServices, index: number) => {
                    types.push('individual');//accessToServices.properties.type);
                }
            );
            
            // Convert the newly updated database record into the internal 
            // representation of users
            const user: User = await this.reconstructUserFromDBUser(dbUser, types);
            
            console.log('Got user: ' + JSON.stringify(user));
            
            callback(null, user);
        }
        catch(e) {
            console.log('An error occured (getUserByEmail): ' + e);
            callback(e, null)
        }
    }
    
    /**
     * Update the user
     * 
     * @param email (string) - The email of the user to be updated
     * @param data (any) - The data to be updated in the database
     * @returns User - The internal representation of the updated user
     */
    async updateUserByEmail(email: string, data): Promise<User> {
        try {
            // Send the update query to the database
            const dbUser: CompletePrismaUser = await Prisma.user.update({
                where: {
                    email: email
                },
                data: data,
                select: this.standardUserSelect
            });
            
            const types: AccessToServicesType[] = [];
            data.services.forEach(
                (accessToServices: AccessToServices, index: number) => {
                    types.push(accessToServices.properties.type);
                }
            );
            
            // Convert the newly updated database record into the internal 
            // representation of users
            const user: User = await this.reconstructUserFromDBUser(dbUser, types);
            
            return user;
        }
        catch(e) {
            // ERROR: The update failed do something appropraitely (to-do)
        }
        
        return null;
    }
    
    /**
     * Delete the user from the database
     * 
     * @param id (string) - The ID of the user to be deleted from the database
     */
    deleteUser(id: string) {
        // TO-DO: Implement
    }
    
    /**
     * Compare the password of a user and compare and a string provided as a 
     * potential match
     */
    async validatePassword(email, inputPassword) {
        console.log('Checking: ' + inputPassword + ' for ' + email);
        
        let db_user: {password: string, salt: string};
        try {
            // Get the user from the datbase because we don't store the 
            // password locally at all
            db_user = await Prisma.user.findUnique(
                {
                    select: {
                        password: true,
                        salt: true
                    },
                    where: {
                        email: email
                    }
                }
            );
        }
        catch(e) {
            console.log('Error Code: ' + (e as PrismaClientInitializationError).errorCode);
            console.log('Error Message: ' + (e as PrismaClientInitializationError).message);
            console.error(e);
        }
        
        console.log('Got: ' + JSON.stringify(db_user) + ' from the database');
        
        // Generate the string to compare the password to this is because the 
        // password is salted (a bunch of random bits are appended at the end 
        // to improve randomness) and then encrypted for security. Also, keep in 
        // mind encryption is purposefully one-way which means we can only 
        // encrypt whats provided as a potential match and then compare. 
        const inputHash = crypto
            .pbkdf2Sync(inputPassword, db_user.salt, 1000, 64, 'sha512')
            .toString('hex')
        
        console.log('comparing: ' + db_user.password + 'with ' + inputHash);
        
        // Check if the generated string matches what we got from the database
        const passwordsMatch = db_user.password === inputHash
        
        console.log('Comparison was: ' + passwordsMatch);
        
        // return the result of the comparison
        return passwordsMatch
    }
    
    private async reconstructUserFromDBUser(user: CompletePrismaUser, types: AccessToServicesType[], originalUser: User = null): Promise<User> {
        console.log('Entering reconstruct user: ' + JSON.stringify(user));
        
        const account_include_param = {
            permissions: true,
            services: {
                include: {
                    order: true,
                    service: {
                        include: {
                            category: true,
                            prices: true
                        }
                    },
                    users: false
                }
            }
        };
        const returnedAccount: Account = await this.reconstructAccountFromDBAccount(user.account, account_include_param, originalUser != null ? originalUser.account : null);
        
        const returnedUserProperties: UserProperties = await retrieveUserProperties(user.account.id, user.id);
        
        // Convert the newly created database representation of the user back into 
        // our internal representation
        const returnedUser: User = {
            id: user.id,
            email: user.email,
            permissions: await Promise.all(user.permissions.map(
                async (dbUserPermissions: CompletePrismaUserPermissions, index: number): Promise<UserPermissions> => {
                    const rightsDefinition: RightsDefinition = await retrieveRightsDefinition(user.account.id, dbUserPermissions.permission.id);
                    
                    const accountPermission: AccountPermission = {
                        id: dbUserPermissions.permission.id,
                        name: dbUserPermissions.permission.name,
                        rights: rightsDefinition != null ? rightsDefinition : originalUser.permissions[index].permission.rights
                    };
                    
                    const userPermissions: UserPermissions = {
                        active: dbUserPermissions.active,
                        assigned: dbUserPermissions.assigned,
                        permission: accountPermission
                    };
                    
                    return userPermissions;
                }
            )),
            aId: user.account.id,
            account: returnedAccount,
            services: await Promise.all(user.services.map(
                async (dbAccessToServices: CompletePrismaAccessToServices, index: number): Promise<AccessToServices> => {
                    const orderProperties: OrderProperties = await retrieveOrderProperties(types[index], dbAccessToServices.order.id);
                    
                    const order: Order = {
                        id: dbAccessToServices.order.id,
                        placed: dbAccessToServices.order.placed,
                        paid: dbAccessToServices.order.paid,
                        total: dbAccessToServices.order.total,
                        properties: orderProperties != null ? orderProperties : originalUser.services[index].order.properties
                    };
                    
                    const serviceCategoryProperties: ServiceCategoryProperties = await retrieveServiceCategoryProperties(dbAccessToServices.service.category.grouping, dbAccessToServices.service.category.id);
                    
                    const serviceCategory: ServiceCategory = {
                        id: dbAccessToServices.service.category.id,
                        grouping: dbAccessToServices.service.category.grouping,
                        properties: serviceCategoryProperties != null ? serviceCategoryProperties : originalUser.services[index].service.category.properties
                    };
                    
                    const serviceProperties: ServiceProperties = await retrieveServiceProperties(serviceCategory.id, dbAccessToServices.service.id);
                    const actualServiceProperties: ServiceProperties = serviceProperties != null ? serviceProperties : originalUser.services[index].service.properties;
                    
                    //console.log('Resulted Service Properties (Reconstruct User): ' + JSON.stringify(actualServiceProperties));
                    
                    const service: Service = {
                        id: dbAccessToServices.service.id,
                        category: serviceCategory,
                        prices: await Promise.all(dbAccessToServices.service.prices.map(
                            async (dbPrice: PrismaPrice, price_index: number): Promise<Price> => {
                                const priceProperties: PriceProperties | null = await retrievePriceProperties(dbPrice.currency, dbPrice.id);
                                
                                const price: Price = {
                                    id: dbPrice.id,
                                    currency: dbPrice.currency,
                                    value: dbPrice.value,
                                    properties: priceProperties !== null ? priceProperties : originalUser.services[index].service.prices[price_index].properties
                                };
                                
                                return price;

                            }
                        )),
                        properties: actualServiceProperties
                    };
                    
                    //console.log('Reconstructed Service Object (Reconstruct User): ' + JSON.stringify(service) + "(from: " + JSON.stringify(originalUser.services[index].service) + ')');
                    
                    const accessProperties: AccessToServicesProperties = await retrieveAccessProperties(types[index] == 'individual' ? user.id : user.account.id, service.id, order.id);
                    
                    console.log(`Access Properties Returned (lib/db/prisma-adabper/reconstructUserFromDBUser): ${JSON.stringify(accessProperties)}`);

                    const accessToServices: AccessToServices = {
                        order: order,
                        service: service,
                        uId: dbAccessToServices.uId,
                        activated: dbAccessToServices.activated,
                        activeDate: dbAccessToServices.activeDate,
                        expiry: dbAccessToServices.expiry,
                        properties: accessProperties != null ? accessProperties : originalUser.services[index].properties
                    };
                    
                    return accessToServices;
                }
            )),
            properties: returnedUserProperties != null ? returnedUserProperties : originalUser.properties
        }
        
        return returnedUser;
    }
    
    private async reconstructAccountFromDBAccount(dbAccount: CompletePrismaAccount, includeParam: object, originalAccount: Account): Promise<Account> {
        console.log('Entering reconstructAccount...');
        
        // Only do further stuff if the create actually worked
        if(dbAccount != null) {
            let returnedAccountPermissions: AccountPermission[] = [];
            
            if(includeParam['permissions'] != false && dbAccount.permissions.length > 0) {
                returnedAccountPermissions = await Promise.all(dbAccount.permissions.map(
                    async (accountPermission: PrismaAccountPermission, index: number): Promise<AccountPermission> => {
                        const rights = await retrieveRightsDefinition(dbAccount.id, accountPermission.id);
                        
                        const permission: AccountPermission = {
                            id: accountPermission.id,
                            name: accountPermission.name,
                            rights: rights != null ? rights : originalAccount.permissions[index].rights
                        };
                        
                        return permission;
                    }
                ));
            }
            
            //console.log('Permissions (Reconstruct Account): ' + JSON.stringify(returnedAccountPermissions));
            
            let returnedUsers: User[] = null;
            
            /*if(includeParam['users'] != false) {
                returnedUsers = await Promise.all(dbAccount.users.map(
                    async (dbUser: CompletePrismaUser, index: number): Promise<User> => {
                        const types: AccessToServicesType[] = [];
                        dbUser.services.forEach(
                            (accessToServices: CompletePrismaAccessToServices, index: number) => {
                                types.push('individual');//accessToServices.properties.type);
                            }
                        );
                        
                        // Convert the newly updated database record into the internal 
                        // representation of users
                        const user: User = await reconstructUserFromDBUser(dbUser, types, originalAccount.users[index]);
                        
                        return user;
                    }
                ));
            }*/
            
            console.log('Users (Reconstruct Account): ' + JSON.stringify(returnedUsers));
            
            const returnedAccountProperties: AccountProperties = await retrieveAccountProperties(dbAccount.organization, dbAccount.id);
            
            // Convert the returned database account object to our 
            // internal representation
            const returnedAccount: Account = {
                id: dbAccount.id,
                name: dbAccount.name,
                organization: dbAccount.organization,
                permissions: returnedAccountPermissions,
                users: returnedUsers,
                services: dbAccount.services,
                properties: returnedAccountProperties != null ? returnedAccountProperties : originalAccount.properties
            };
            
            returnedAccount.permissions.forEach((permission: AccountPermission, index: number) => { permission.aId = returnedAccount.id; });
            
            console.log("Reconstructed Account's ID: " + returnedAccount.id);
            console.log("Reconstructed Account's Name: " + returnedAccount.name);
            console.log("Reconstructed Account's organization: " + returnedAccount.organization);
            
            // Return the internal representation we constructed from the 
            // returned database entry we created
            return returnedAccount;
        }
    }

    /**
     * Get the list of services from the database
     * 
     * @returns {Promise<Service[]>``} The list of services found in the database (in our internal respresentation format)
     */
    async listServices(): Promise<Service[]> {
        let dbServices: CompletePrismaService[] = null;
        
        try {
            // Query the database to try to get the list of services from it
            dbServices = await Prisma.service.findMany(
                {
                    include: {
                        prices: true, 
                        category: true
                    }
                }
            );
        }
        catch(e) { 
            // Do nothing on DB error (act as though nothing was returned)
        }
        
        // Make sure we got a record back from the database
        if(dbServices != null) {
            // Loop over the returned database Service objects and convert to our internal representation
            const services: Service[] = await Promise.all(
                dbServices.map(
                    async dbService => {
                        // Get Service Category properties
                        const serviceCategoryProps: ServiceCategoryProperties = await retrieveServiceCategoryProperties(dbService.category.grouping, dbService.category.id);
                        
                        //console.log(`Service Category Properties being used (/lib/db/prisma-adapter/list-services): ${JSON.stringify(serviceCategoryProps)} `);

                        // Convert the returned ServiceCategory database reprsentation into our internal one
                        const serviceCategory: ServiceCategory = {
                            id: dbService.category.id,
                            grouping: dbService.category.grouping,
                            properties: serviceCategoryProps
                        }

                        // Loop over list of prices associated with this service and convert to internal representation
                        const servicePrices: Price[] = await Promise.all(
                            dbService.prices.map(
                                async dbPrice => {
                                    // Get Price properties
                                    const priceProps: PriceProperties = await retrievePriceProperties(dbPrice.currency, dbPrice.id);
                                    
                                    // Convert the returned database Price representation to our internal one
                                    const price: Price = {
                                        id: dbPrice.id,
                                        currency: dbPrice.currency,
                                        value: dbPrice.value,
                                        properties: priceProps
                                    };
                                    
                                    // Return the new internal representation object
                                    return price;
                                }
                            )
                        );

                        // Get Service properties
                        const serviceProps: ServiceProperties = await retrieveServiceProperties(dbService.categoryId, dbService.id);
                        // Convert the returned database Service representation to our internal one
                        const service: Service = {
                            id: dbService.id,
                            category: serviceCategory,
                            prices: servicePrices,
                            properties: serviceProps
                        }

                        //console.log(`Returned Service Object /lib/db/prisma-adapter/listServices): ${JSON.stringify(service)}`);

                        // Return the new internal representation object
                        return service;
                    }
                )
            );

            //console.log(`Returned Services List (/lib/db/prisma-adapter/listServices): ${JSON.stringify(services)}`);
            
            // Return the list of services (in our internal representation format)
            return services;
        }
        
        // Technically, this could probably be an else clause as well but this 
        // way it's slightly more resliant to weird unexpected issues
        return null;
    }
}