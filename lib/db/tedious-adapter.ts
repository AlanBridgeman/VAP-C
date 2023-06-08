/*
 *************************************************************
 * Name: prisma-adapter.ts (Database Access via Prisma)
 * Description: Provide a functionality oriented abstraction 
 *              above the database access provided by Prisma
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import { once } from 'events';
import crypto from 'crypto'
import { v4 as newUUID } from 'uuid';
import merge from 'lodash.merge';
import DBAdapter from './db-adapter';
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
import { Connection, Request, Column } from 'tedious';
import { resolvePlugin } from '@babel/core';

export default class TediousAdapter implements DBAdapter {
    private _connection: Connection;
    private _isConnected: boolean = false;
    
    constructor() {
        return ( async() => { 
            // Create connection to database
            const config = {
                authentication: {
                    options: {
                        userName: process.env.SQL_SERVER_USERNAME,
                        password: process.env.SQL_SERVER_PASSWORD
                    },
                    type: "default"
                },
                server: process.env.SQL_SERVER,
                options: {
                    database: process.env.SQL_SERVER_DATABASE,
                    encrypt: true,
                    trustServerCertificate: false,
                    hostNameInCertificate: '*.database.windows.net',
                    loginTimeout: 30
                }
            };
            /* 
                //Use Azure VM Managed Identity to connect to the SQL database
                const config = {
                    server: process.env["db_server"],
                    authentication: {
                        type: 'azure-active-directory-msi-vm',
                    },
                    options: {
                        database: process.env["db_database"],
                        encrypt: true,
                        port: 1433
                    }
                };
                
                //Use Azure App Service Managed Identity to connect to the SQL database
                const config = {
                    server: process.env["db_server"],
                    authentication: {
                        type: 'azure-active-directory-msi-app-service',
                    },
                    options: {
                        database: process.env["db_database"],
                        encrypt: true,
                        port: 1433
                    }
                };
            */
            
            this._connection = new Connection(config);
            
            // Attempt to connect and execute queries if connection goes through
            this._connection.on("connect", err => {
                if (err) {
                    this._connection = null;
                    console.error(err.message);
                }
            });

            this._connection.connect();
            
            await once(this._connection, 'connect');

            return this;
        })() as unknown as TediousAdapter;
    }
    
    private async queryDatabase(query: string, onValue?: (value: Column, index: number) => void, onRow?: (columns: Column[]) => void): Promise<void> {
        /*if(!this._isConnected) {
            await once(this._connection, 'connect');
        }*/

        console.log("Reading rows from the Table...");
        
        // Read all rows from table
        const request: Request = new Request(query, 
            (err, rowCount) => {
                if (err) {
                    console.error(err.message);
                }
                else {
                    console.log(`${rowCount} row(s) returned`);
                }
            }
        );

        // If the onRow callback isn't defined use the default one that calls the onValue callback
        if(onRow == undefined || onRow == null) {
            if(onValue != undefined && onValue != null) {
                onRow = this.defaultOnRow(onValue);
            }
            else {
                throw new Error('You need to specify the onRow or onValue callback');
            }
        }

        //var isComplete: boolean = false;

        request.on("row", onRow);
        request.on('done', () => {
            console.log('The request is done');
        });
        /*request.on('doneInProc', (rowCount, more, rows) => {
            if(more == false) {
                isComplete = true;
            }
            console.log('The request is doneInProc (more: ' + more + ')');
        });*/
        request.on('doneProc', () => {
            console.log('The request is doneProc');
        });
        
        this._connection.execSql(request);

        //do {
            await Promise.any([once(request, 'done'), /*once(request, 'doneInProc'), */once(request, 'doneProc')]);
        //} while(!isComplete)
        console.log('Query completed.');
    }

    private defaultOnRow(onValue: (value: Column, index: number) => void) {
        return columns => columns.forEach(onValue);
    }

    listServices() {
    }

    /**
     * Get all the users associated with the given account
     * 
     * @param id (string) - The id of the account to get the users for
     * @returns User[] - The list of users (in internal user representation format)
     */
    async getUsersInAccount(id: string): Promise<User[]> {
        var users: User[];

        const onRow = (columns: Column[]): void => {
            const user: User = {
                email: '',
                services: [],
                permissions: [],
                properties: undefined
            };

            columns.forEach(
                (column: Column, index: number): void => {
                    console.log("%s\t%s", column.metadata.colName, column.value);
                    user[column.metadata.colName] = column.value;
                }
            );
            
            users.push(user);
        };
        
        const query = `
            SELECT 
                *
            FROM 
                [dbo].[User] u
        `;

        await this.queryDatabase(query, onRow);

        return users;
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
        var rtnAccount: Account;

        const onRow = (columns: Column[]): void => {
            columns.forEach(
                (column: Column, index: number): void => {
                    console.log("%s\t%s", column.metadata.colName, column.value);
                    rtnAccount[column.metadata.colName] = column.value;
                }
            );
        };
        
        const query = `
            SELECT 
                *
            FROM 
                [dbo].[Account] a
        `;

        await this.queryDatabase(query, onRow);

        return rtnAccount;
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
        var rtnUser: User;

        const onRow = (columns: Column[]): void => {
            columns.forEach(
                (column: Column, index: number): void => {
                    console.log("%s\t%s", column.metadata.colName, column.value);
                    rtnUser[column.metadata.colName] = column.value;
                }
            );
        };
        
        const query = `
            SELECT 
                *
            FROM 
                [dbo].[User] u
        `;

        await this.queryDatabase(query, onRow);

        return rtnUser;
    }
     
    /**
     * Attempt to find the account in the database by the name provided
     * 
     * @param name (string) - The name of the account to find in the database
     * @return Account - The internal representation of the account found in the database
     */
    async findAccountByName(name: string): Promise<Account> {
        var account: Account;

        const onRow = (columns: Column[]): void => {
            columns.forEach(
                (column: Column, index: number): void => {
                    console.log("%s\t%s", column.metadata.colName, column.value);
                    account[column.metadata.colName] = column.value;
                }
            );
        };
        
        const query = `
            SELECT 
                *
            FROM 
                [dbo].[Account] a
        `;

        await this.queryDatabase(query, onRow);

        return account;
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
        var user: User;

        const onRow = (columns: Column[]): void => {
            columns.forEach(
                (column: Column, index: number): void => {
                    console.log("%s\t%s", column.metadata.colName, column.value);
                    user[column.metadata.colName] = column.value;
                }
            );
        };
        
        const query = `
            SELECT 
                *
            FROM 
                [dbo].[Account] a
        `;

        await this.queryDatabase(query, onRow);

        callback(null, user);
    }
     
    /**
     * Find the user in the dabase by email
     * 
     * @param email (string) - The email of the user to find
     * @param callback (Function(error: any, user: User|null)) - The callback to call
     * @return N/A (void) - Uses a callback instead
     */
    async findUserByEmail(email: string, callback: (err: any, user?: User) => void): Promise<void> {
        var data = {};

        const onRow = (columns: Column|Column[]): void => {
            // Because Column is an outside type defined by an external 
            // entity (the Tedious driver library) we have to check the 
            // type this way instead of using a instanceof as instaceof 
            // will only work for Clases where this method gives the 
            // flexibility to work with both classes and interfaces as far 
            // as I understand/know
            var isColumn: boolean = (columns as Column).value !== undefined && (columns as Column).value !== null;
            
            console.log('The columns item is a column: ' + isColumn);

            if(isColumn && columns.value.contains(',')) {
                var columns_arr: Column[] = [];
                columns.value.split(',').foreach(
                    (val: String, index: number) => {
                        var column_copy = columns;
                        column_copy.value = val;
                        columns_arr.push(column_copy);
                    }
                )
                columns = columns_arr;
            }
            
            if(columns instanceof Array) {
                columns.forEach(
                    (column: Column, index: number): void => {
                        console.log("%s\t%s", column.metadata.colName, column.value);
                        data[column.metadata.colName] = column.value;
                    }
                );
            }
            else {
                console.log('Setting ' + columns.metadata.colName + ': ' + columns.value + ' from DB');
                if(data.hasOwnProperty(columns.metadata.colName)) {
                    data[columns.metadata.colName] = [data[columns.metadata.colName], columns.value];
                }
                else {
                    data[columns.metadata.colName] = columns.value;
                }
            }

            console.log('Data (inside onRow): ' + JSON.stringify(data));
        };
        
        /*const query = `
            SELECT 
                u.id userId,
                u.email userEmail,
                a.id accountId,
                a.name accountName,
                a.organization accountOrganization,
                up.assigned userPermissionAssigned,
                up.active userPermissionActive,
                ap.id accountPermissionId,
                ap.name accountPermissionName,
                ats.activated accessToServicesActivated,
                ats.activeDate accessToServicesActivationDate,
                ats.expiry accessToServicesExpiryDate,
                s.id serviceId,
                p.id servicePriceId,
                p.value servicePriceValue,
                p.currency servicePriceCurrency,
                sc.id serviceCategoryId,
                sc.grouping serviceCategoryGrouping,
                o.id orderId,
                o.placed orderPlacedDate,
                o.paid orderPaidDate,
                o.total orderTotal
            FROM 
                [dbo].[User] u 
            JOIN [dbo].[Account] a ON a.id = u.aId
            JOIN [dbo].[UserPermissions] up ON up.uId = u.id 
            JOIN [dbo].[AccountPermission] ap ON up.pId = ap.id 
            JOIN [dbo].[AccessToServices] ats ON u.id = ats.uId 
            JOIN [dbo].[Service] s ON ats.sId = s.id
            JOIN [dbo].[Price] p On p.sId = s.id
            JOIN [dbo].[ServiceCategory] sc ON s.categoryId = sc.id
            JOIN [dbo].[Order] o ON ats.oId = o.id
            WHERE
                u.email = '${email}'
        `;*/
        const query = `
            DECLARE @accesses_activated VARCHAR(MAX);
            DECLARE @accesses_active_date VARCHAR(MAX);
            DECLARE @accesses_expiry VARCHAR(MAX);
            DECLARE @services_id VARCHAR(MAX);
            DECLARE @services_price_id VARCHAR(MAX);
            DECLARE @services_price_value VARCHAR(MAX);
            DECLARE @services_price_currency VARCHAR(MAX);
            DECLARE @services_category_id VARCHAR(MAX);
            DECLARE @services_category_grouping VARCHAR(MAX);
            DECLARE @orders_id VARCHAR(MAX);
            DECLARE @orders_placed VARCHAR(MAX);
            DECLARE @orders_paid VARCHAR(MAX);
            DECLARE @orders_total VARCHAR(MAX);
            
            SELECT
                @accesses_activated = COALESCE(@accesses_activated + ', ' + CONVERT(VARCHAR, ats.activated), CONVERT(VARCHAR, ats.activated)),
                @accesses_active_date = COALESCE(@accesses_active_date + ', ' + CONVERT(VARCHAR, ats.activeDate), CONVERT(VARCHAR, ats.activeDate)),
                @accesses_expiry = COALESCE(@accesses_expiry, CONVERT(VARCHAR, ats.expiry), CONVERT(VARCHAR, ats.expiry)),
                @services_id = COALESCE(@services_id + ', ' + CONVERT(VARCHAR, s.id), CONVERT(VARCHAR, s.id)),
                @services_price_id = COALESCE(@services_price_id + ', ' + CONVERT(VARCHAR, p.id), CONVERT(VARCHAR, p.id)),
                @services_price_value = COALESCE(@services_price_value + ', ' + CONVERT(VARCHAR, p.value), CONVERT(VARCHAR, p.value)),
                @services_price_currency = COALESCE(@services_price_currency + ', ' + p.currency, p.currency),
                @services_category_id = COALESCE(@services_category_id + ', ' + CONVERT(VARCHAR, sc.id), CONVERT(VARCHAR, sc.id)),
                @services_category_grouping = COALESCE(@services_category_grouping + ', ' + sc.grouping, sc.grouping),
                @orders_id = COALESCE(@orders_id + ', ' + CONVERT(VARCHAR, o.id), CONVERT(VARCHAR, o.id)),
                @orders_placed = COALESCE(@orders_placed + ', ' + CONVERT(VARCHAR, o.placed), CONVERT(VARCHAR, o.placed)),
                @orders_paid = COALESCE(@orders_paid + ', ' + CONVERT(VARCHAR, o.paid), CONVERT(VARCHAR, o.paid)),
                @orders_total = COALESCE(@orders_total + ', ' + CONVERT(VARCHAR, o.total), CONVERT(VARCHAR, o.total))
            FROM 
                [dbo].[User] u 
            JOIN [dbo].[Account] a ON a.id = u.aId
            JOIN [dbo].[UserPermissions] up ON up.uId = u.id 
            JOIN [dbo].[AccountPermission] ap ON up.pId = ap.id 
            JOIN [dbo].[AccessToServices] ats ON u.id = ats.uId 
            JOIN [dbo].[Service] s ON ats.sId = s.id
            JOIN [dbo].[Price] p On p.sId = s.id
            JOIN [dbo].[ServiceCategory] sc ON s.categoryId = sc.id
            JOIN [dbo].[Order] o ON ats.oId = o.id;
            
            SELECT 
                u.id userId,
                u.email userEmail,
                a.id accountId,
                a.name accountName,
                a.organization accountOrganization,
                up.assigned userPermissionAssigned,
                up.active userPermissionActive,
                ap.id accountPermissionId,
                ap.name accountPermissionName,
                @accesses_activated accessToServicesActivated,
                @accesses_active_date accessToServicesActivationDate,
                @accesses_expiry accessToServicesExpiryDate,
                @services_id serviceId,
                @services_price_id servicePriceId,
                @services_price_value servicePriceValue,
                @services_price_currency servicePriceCurrency,
                @services_category_id serviceCategoryId,
                @services_category_grouping serviceCategoryGrouping,
                @orders_id orderId,
                @orders_placed orderPlacedDate,
                @orders_paid orderPaidDate,
                @orders_total orderTotal
            FROM 
                [dbo].[User] u 
            JOIN [dbo].[Account] a ON a.id = u.aId
            JOIN [dbo].[UserPermissions] up ON up.uId = u.id 
            JOIN [dbo].[AccountPermission] ap ON up.pId = ap.id
        `;

        await this.queryDatabase(query, null, onRow);

        console.log('User Data: ' + JSON.stringify(data));

        var rights: RightsDefinition = await retrieveRightsDefinition(data['accountId'], data['accountPermissionId']);

        var accountPermission: AccountPermission = {
            id: data['accountPermissionId'],
            name: data['accountPermissionName'],
            aId: data['accountId'],
            users: [data['userId']],
            rights: rights
        };

        var accountProperties: AccountProperties = await retrieveAccountProperties(data['accountOrganization'], data['accountId']);

        var account: Account = {
            id: data['accountId'],
            name: data['accountName'],
            organization: data['accountOrganization'],
            permissions: [accountPermission],
            properties: accountProperties
        };

        var userPermissions: UserPermissions = {
            active: data['userPermissionActive'],
            assigned: data['userPermissionAssigned'],
            permission: accountPermission
        };

        var services: AccessToServices[] = [];
        if(data['serviceId'].includes(',')) {
            for(var i=0;i < data['serviceId'].split(',').length;i++) {
                var serviceCategoryProperties: ServiceCategoryProperties = await retrieveServiceCategoryProperties(data['serviceCategoryGrouping'].split(',')[i].trim(), data['serviceCategoryId'].split(',')[i].trim());

                var serviceCategory: ServiceCategory = {
                    id: data['serviceCategoryId'].split(',')[i].trim(),
                    grouping: data['serviceCategoryGrouping'].split(',')[i].trim(),
                    properties: serviceCategoryProperties
                };

                var priceProperties: PriceProperties = await retrievePriceProperties(data['servicePriceCurrency'].split(',')[i].trim(), data['servicePriceId'].split(',')[i].trim());
                
                var price: Price = {
                    id: data['servicePriceId'].split(',')[i].trim(),
                    value: data['servicePriceValue'].split(',')[i].trim(),
                    currency: data['servicePriceCurrency'].split(',')[i].trim(),
                    sId: data['serviceId'].split(',')[i].trim(),
                    properties: priceProperties
                };

                var serviceProperties: ServiceProperties = await retrieveServiceProperties(data['serviceCategoryId'].split(',')[i].trim(), data['serviceId'].split(',')[i].trim());
                
                var service: Service = {
                    id: data['serviceId'].split(',')[i].trim(),
                    categoryId: data['serviceCategoryId'].split(',')[i].trim(),
                    category: serviceCategory,
                    prices: [price],
                    customers: [data['userId']],
                    properties: serviceProperties
                };

                var orderProperties = await retrieveOrderProperties('individual', data['orderId'].split(',')[i].trim());

                var order: Order = {
                    id: data['orderId'].split(',')[i].trim(),
                    placed: data['orderPlacedDate'].split(',')[i].trim(),
                    paid: data['orderPaidDate'].split(',')[i].trim(),
                    total: data['orderTotal'].split(',')[i].trim(),
                    properties: orderProperties
                };

                var accessProperties: AccessToServicesProperties = await retrieveAccessProperties(data['userId'], data['serviceId'].split(',')[i].trim(), data['orderId'].split(',')[i].trim());

                var accessToService: AccessToServices = {
                    uId: data['userId'],
                    sId: data['serviceId'].split(',')[i].trim(),
                    service: service,
                    oId: data['orderId'].split(',')[i].trim(),
                    order: order,
                    activated: data['accessToServicesActivated'].split(',')[i].trim(),
                    activeDate: (typeof data['accessToServicesActivationDate']) == 'string' ? data['accessToServicesActivationDate'].split(',')[i].trim() : data['accessToServicesActivationDate'],
                    expiry: (typeof data['accessToServicesExpiryDate']) == 'string' ? data['accessToServicesExpiryDate'].split(',')[i].trim() : data['accessToServicesExpiryDate'],
                    properties: accessProperties
                };

                services.push(accessToService);
            }
        }
        else {
            var serviceCategory: ServiceCategory = {
                id: data['serviceCategoryId'],
                grouping: data['serviceCategoryGrouping'],
                properties: null
            };

            var price: Price = {
                id: data['servicePriceId'],
                value: data['servicePriceValue'],
                currency: data['servicePriceCurrency'],
                sId: data['serviceId'],
                properties: null
            };

            var service: Service = {
                id: data['serviceId'],
                categoryId: data['serviceCategoryId'],
                category: serviceCategory,
                prices: [price],
                customers: [data['userId']],
                properties: null
            };

            var order: Order = {
                id: data['orderId'],
                placed: data['orderPlacedDate'],
                paid: data['orderPaidDate'],
                total: data['orderTotal'],
                properties: null
            };

            var accessToService: AccessToServices = {
                uId: data['userId'],
                sId: data['serviceId'],
                service: service,
                oId: data['orderId'],
                order: order,
                activated: data['accessToServicesActivated'],
                activeDate: data['accessToServicesActivationDate'],
                expiry: data['accessToServicesExpiryDate'],
                properties: null
            };

            services.push(accessToService);
        }

        const returnedUserProperties: UserProperties = await retrieveUserProperties(data['accountId'], data['userId']);
        
        console.log('Returned User Properties: ' + JSON.stringify(returnedUserProperties));
        
        var user: User = {
            id: data['userId'],
            email: data['userEmail'],
            aId: data['accountId'],
            account: account,
            permissions: [userPermissions],
            services: services,
            properties: returnedUserProperties != null ? returnedUserProperties : null
        };

        callback(null, user);
    }
     
    /**
     * Update the user
     * 
     * @param email (string) - The email of the user to be updated
     * @param data (any) - The data to be updated in the database
     * @returns User - The internal representation of the updated user
     */
    async updateUserByEmail(email: string, data): Promise<User> {
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
    async validatePassword(email, inputPassword): Promise<boolean> {
        return true;
    }
}