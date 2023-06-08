/*
 *************************************************************
 * Name: table-storage.ts (Azure Table Storage Access)
 * Description: This file is intended to provide centralized 
 *              functionality for accessing Azure Table 
 *              Storage so that the specifics around how to 
 *              connect to an Azure Storage Account, 
 *              specifically Table Storage (particularly 
 *              credentials etc...) are abstracted away from 
 *              other business logic and front-end code
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 **************************************************************
 */

import { TableClient, AzureNamedKeyCredential, GetTableEntityResponse, TableEntityResult } from '@azure/data-tables'
import merge from 'lodash.merge';

import { SupportedLocales } from '../locales';

import { User } from '../../types/User';
import { Account } from '../../types/Account';
import { Locale } from '../../types/Locale';
import { AccountPermission } from '../../types/AccountPermission'; 
import { Order } from '../../types/Order'; 
import { AccessToServices } from '../../types/AccessToServices';
import { ServiceCategory } from '../../types/ServiceCategory';
import { Service } from '../../types/Service';
import { Price } from '../../types/Price';
import { Description } from '../../types/Description';
import { Name } from '../../types/Name';
import { UserProperties } from '../../types/UserProperties';
import { AccessToServicesProperties } from '../../types/AccessToServicesProperties';
import { ServiceProperties } from '../../types/ServiceProperties';
import { ServiceCategoryProperties } from '../../types/ServiceCategoryProperties';
import { OrderProperties } from '../../types/OrderProperties';
import { RightsDefinition } from '../../types/RightsDefinition';
import { AccountProperties } from '../../types/AccountProperties';
import { PriceProperties } from '../../types/PriceProperties';
import { ServiceCustomUserProperty } from '../../types/ServiceCustomUserProperty';

//============================================================
// Constants
//============================================================
// Needed Azure Table Storage (part of Azure Storage Account) 
// credentials. Generally, loaded from environment variables (for 
// security, etc...)

// For setting and getting system requried properties (ex. Locale/language 
// info, services and prices info, order info, etc...)
const SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME: string = typeof process.env.SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME !== 'undefined' ? process.env.SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME : '';
const SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY: string = typeof process.env.SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY !== 'undefined' ? process.env.SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY : '';
const LOCALE_PROPERTIES_TABLE: string = typeof process.env.LOCALE_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.LOCALE_PROPERTIES_STORAGE_TABLE_NAME : '';
const ORDER_PROPERTIES_TABLE: string = typeof process.env.ORDER_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.ORDER_PROPERTIES_STORAGE_TABLE_NAME : '';
const ACCESS_PROPERTIES_TABLE: string = typeof process.env.ACCESS_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.ACCESS_PROPERTIES_STORAGE_TABLE_NAME : '';
const SERVICE_CATEGORY_PROPERTIES_TABLE: string = typeof process.env.SERVICE_CATEGORY_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.SERVICE_CATEGORY_PROPERTIES_STORAGE_TABLE_NAME : '';
const SERVICE_PROPERTIES_TABLE: string = typeof process.env.SERVICE_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.SERVICE_PROPERTIES_STORAGE_TABLE_NAME : '';
const PRICE_PROPERTIES_TABLE: string = typeof process.env.PRICE_PROPERTIES_STORAGE_TABLE_NAME !== 'undefined' ? process.env.PRICE_PROPERTIES_STORAGE_TABLE_NAME : '';

// For setting and getting Account and User Properties (Account's 
// and User's NoSQL records) seperated from the system properties 
// because these are "default" values because account 
// administrators can enable a Bring-Your-Own-Storage (BYOS) 
// functionality for situations where they'd rather be in-charge 
// of their own data (ex. legal data residency requirements, etc...)
// 
// Note, this (BYOS functionality) is done at an account level 
// rather than a user one as a user's only data is a single record 
// in the users' properties table so it makes little sense for an 
// individual user to have an entirely seperate storage account. 
// And even if there exists such a use case, where they want a 
// single segregated user in this way, they can always create an 
// entirely seperate account rather than having a user under an 
// existing account. Which would allow them to then set the 
// account settings. In theory, this may cause multiple purchases 
// of the same service as you can't share access across multiple 
// accounts. However, this seems like a rare enough situation, if 
// it exists at all, that I'm comfortable saying it's a requirment 
// of this desired segregation/privacy
// 
// To reiterate, the variables defined here/below are the default values set 
// if no alternative values are providede
const ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME: string = typeof process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_ACCOUNT_NAME !== 'undefined' ? process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_ACCOUNT_NAME : '';
const ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY: string = typeof process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_ACCOUNT_KEY !== 'undefined' ? process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_ACCOUNT_KEY : '';
const DEFAULT_ACCOUNT_PROPERTIES_TABLE: string = typeof process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_TABLE_NAME !== 'undefined' ? process.env.ACCOUNT_PROPERTIES_DEFAULT_STORAGE_TABLE_NAME : '';
const DEFAULT_RIGHTS_TABLE: string = typeof process.env.RIGHTS_DEFAULT_STORAGE_TABLE_NAME !== 'undefined' ? process.env.RIGHTS_DEFAULT_STORAGE_TABLE_NAME : '';
const DEFAULT_USER_PROPERTIES_TABLE: string = typeof process.env.USER_PROPERTIES_DEFAULT_STORAGE_TABLE_NAME !== 'undefined' ? process.env.USER_PROPERTIES_DEFAULT_STORAGE_TABLE_NAME : '';

//------------------------------------------------------------
// Service Specific Constants
//------------------------------------------------------------

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Video Editing Constants
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

// For setting and getting User Tokens related to Video Editing services
const VIDEO_EDITING_STORAGE_ACCOUNT_NAME: string = typeof process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME !== 'undefined' ? process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME : '';
const VIDEO_EDITING_STORAGE_ACCOUNT_KEY: string = typeof process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY !== 'undefined' ? process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY : '';
const VIDEO_EDITING_TOKENS_TABLE_NAME: string = typeof process.env.VIDEO_EDITING_TOKENS_TABLE_NAME !== 'undefined' ? process.env.VIDEO_EDITING_TOKENS_TABLE_NAME : '';

//============================================================
// Type Definitions
//============================================================

interface AzureStorageCredentials {
    table_name: string,
    storage_key: string,
    storage_account_name: string,
    storage_url?: string
}

//------------------------------------------------------------
// Service Specific Type Defintions
//------------------------------------------------------------

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Video Editing Type Definitions
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export interface VideoEditingToken {
    token: string,
    refresh: string,
    approver: string
}

//================================================================================
// Helper Functions (functionality not associated withspecific propertties etc...)
//================================================================================

/** 
 * Setup default values for credentials to an Azure Storage Account
 * 
 * @param default_creds
 * @param creds
 * @return 
 */
function ensureCredentials(default_creds: AzureStorageCredentials, creds?: AzureStorageCredentials): AzureStorageCredentials {
    // Because credentials isn't set, set it to the default
    if(!creds) {
        creds = default_creds;
    }

    // If the optional field isn't set (regardless if it was provided by 
    // the user or the default) set it appropriately.
    // Note: This value is special in that it uses anoter of the values 
    //       within the object to define itself which makes it difficult to 
    //       inline this definition
    if(!creds.storage_url) {
        creds.storage_url = `https://${creds.storage_account_name}.table.core.windows.net`;
    }

    return creds;
}

/**
 * Helper functions to filter the User Properties to only the sutt that's 
 * really cared about. In other words, get rid of all the extra metadata 
 * stuff Azure tacks on and any of the stuff we only need for 
 * infrastructure reasons.
 * 
 * @param entity 
 * @returns 
 */
function removeAzureInfo(entity: {[propName: string]: any}): {[propName: string]: any} {
    // Get a list of all properties (specifically their names)
    const propNames: string[] = Object.keys(entity);

    // Create a new object to ONLY hold the stuff we want to keep
    const props: {[propName: string]: any} = {};

    // Loop over the properties on the object and disregard any Azure specific stuff
    propNames.forEach(
        (prop_name: string, index: number, prop_names: string[]) => {
            if(prop_name != 'partitionKey' && prop_name != 'rowKey' && prop_name != 'etag' && prop_name != 'timestamp' && prop_name != 'odata.metadata') {
                props[prop_name] = entity[prop_name];
            }
        }
    );

    // Return the newly filtered list of properties
    return props;
}

/**
 * Save all the various properties (NoSQL records) associated with a user
 * 
 * @param user (User) - The user in which all records to save are found based on
 */
 export async function saveAllPropertiesAssociatedWithUser(user: User) {
    if(typeof user.account !== 'undefined') {
        await saveAccountProperties(user.account);
        user.account.permissions.forEach(
            async (accountPermission: AccountPermission, index: number) => {
                await saveRightsDefinition(accountPermission);
            }
        );
    }
    user.services.forEach(
        async (accessToServices: AccessToServices, index: number) => {
            await saveOrderProperties(accessToServices.order, accessToServices.properties.type);
            await saveServiceCategoryProperties(accessToServices.service.category)
            accessToServices.service.prices.forEach(
                async (price: Price, index: number) => {
                    await savePriceProperties(price);
                }
            );
            await saveServiceProperties(accessToServices.service);
            await saveAccessProperties(accessToServices);
        }
    );
    await saveUserProperties(user);
}

//=================================================================
// System Controlled Properties
//=================================================================

//-----------------------------------------------------------------
// Locale (Language) accessors (getters, setters, mutators, etc...)
//-----------------------------------------------------------------

type LocaleTableEntity = {
    partitionKey: 'en' | 'fr',
    rowKey: 'CA',
    name: string,
    description?: string,
    active_0?: boolean,
    [key: `active_page_${string}`]: boolean,
    [key: `active_service_${string}`]: boolean
};

async function saveLocale(locale: Locale, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the locale provided is null 
    // just return because there is nothing we can do with that 
    if(locale == null) {
        console.log("Can't save anything because the locale provided is null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: LOCALE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential: AzureNamedKeyCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd: ' + e);
        return;
    }
    
    const entity: LocaleTableEntity = {
        partitionKey: locale.language,
        rowKey: locale.country,
        name: locale.name
    };

    if(typeof locale.description !== 'undefined' && locale.description != null) {
        entity["description"] = locale.description;
    }

    if(typeof locale.active['*'] !== 'undefined' && locale.active['*'] != null) {
        entity["active_0"] = locale.active['*'];
    }

    if(typeof locale.active.pages !== 'undefined' && locale.active.pages != null) {
        for(let page_name in locale.active.pages) {
            entity[`active_page_${(page_name as string)}`] = locale.active.pages[page_name];
        }
    }
    
    if(typeof locale.active.services !== 'undefined' && locale.active.services != null) {
        for(let service_name in locale.active.services) {
            entity[`active_service_${(service_name as string)}`] = locale.active.services[service_name];
        }
    }

    console.log('Entity (Locale): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write: ' + e);
        return;
    }
}

async function retrieveLocale(language: 'en'|'fr', country: 'CA', table_credentials?: AzureStorageCredentials): Promise<Locale | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: LOCALE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: LocaleTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<LocaleTableEntity>(language, country);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd: ' + e);
        return null;
    }

    const returnedLocale: Locale = {
        language: language,
        country: country,
        name: entity["name"],
        active: {
            '*': false
        }
    };

    if(typeof entity["description"] !== 'undefined' && entity["description"] != null) {
        returnedLocale.description = entity["description"];
    }

    if(typeof entity["active_0"] !== 'undefined' && entity["active_0"] != null) {
        returnedLocale.active["*"] = entity["active_0"];
    }

    // Loop over all the properties in entity and find ones that match 
    // lang:page:<PAGE> or lang:service:<SERVICE> and set them in the 
    // returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            const page_regex = new RegExp(`/active_page_*/`)
            const service_regex = new RegExp(`/active_service_*/`)
            
            if(page_regex.test(key)) {
                if(returnedLocale.active.pages == undefined || returnedLocale.active.pages == null) {
                    returnedLocale.active.pages = {};
                }

                const objIndex: keyof LocaleTableEntity = key as keyof LocaleTableEntity;
                returnedLocale.active.pages[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
            }
            else if(service_regex.test(key)) {
                if(typeof returnedLocale.active.services === 'undefined' || returnedLocale.active.services == null) {
                    returnedLocale.active.services = {};
                }

                const objIndex: keyof LocaleTableEntity = key as keyof LocaleTableEntity;
                returnedLocale.active.services[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
            }
        }
    )

    console.log('Reconstructed Locale Object: ' + JSON.stringify(returnedLocale));

    return returnedLocale;
}

//------------------------------------------------------------------------------------------
// Rights Definitions (Permission Properties) accessors (getters, setters, mutators, etc...)
//------------------------------------------------------------------------------------------

type RightsDefinitionTableEntity = {
    partitionKey: string, 
    rowKey: string,
    [key: `description_${string}`]: string,
    [key: `perm_approve_${string}`]: boolean,
    [key: `perm_change_${string}`]: boolean,
    [key: `perm_act_${string}`]: boolean,
    [key: `perm_review_${string}`]: boolean,
};

export async function saveRightsDefinition(accountPermission: AccountPermission, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the permission's rights isn't defined or is null 
    // just return because there is nothing we can do with that 
    if(typeof accountPermission.rights === 'undefined' || accountPermission.rights == null) {
        console.log("Can't save anything because the permission provided doesn't have defined rights or the rights are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_RIGHTS_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Rights Definition): ' + e);
        return;
    }
    
    const entity: RightsDefinitionTableEntity = {
        partitionKey: typeof accountPermission.aId !== 'undefined' ? accountPermission.aId : '',
        rowKey: typeof accountPermission.id !== 'undefined' ? accountPermission.id.toString() : ''
    };
    
    if(typeof accountPermission.rights.descriptions !== 'undefined' && accountPermission.rights.descriptions != null) {
        for(let i = 0;i < accountPermission.rights.descriptions.length;i++) {
            if(typeof accountPermission.rights.descriptions[i].value !== 'undefined') {
                const objIndex: keyof RightsDefinitionTableEntity = (`description_${accountPermission.rights.descriptions[i].locale.language}${accountPermission.rights.descriptions[i].locale.country}` as (keyof RightsDefinitionTableEntity));
                (entity[objIndex] as string) = (accountPermission.rights.descriptions[i].value as string);
            }
        }
    }
    
    if(typeof accountPermission.rights.permissions.approve !== 'undefined' && accountPermission.rights.permissions.approve != null) {
        if(accountPermission.rights.permissions.approve['*']) {
            entity["perm_approve_0"] = accountPermission.rights.permissions.approve['*'];
        }
        else {
            for(let service_name in accountPermission.rights.permissions.approve) {
                entity[`perm_approve_${service_name}`] = accountPermission.rights.permissions.approve[service_name];
            }
        }
    }

    if(typeof accountPermission.rights.permissions.change !== 'undefined' && accountPermission.rights.permissions.change != null) {
        if(accountPermission.rights.permissions.change['*']) {
            entity["perm_change_0"] = accountPermission.rights.permissions.change['*'];
        }
        else {
            for(let service_name in accountPermission.rights.permissions.change) {
                entity[`perm_change_${service_name}`] = accountPermission.rights.permissions.change[service_name];
            }
        }
    }

    if(typeof accountPermission.rights.permissions.act !== 'undefined' && accountPermission.rights.permissions.act != null) {
        if(accountPermission.rights.permissions.act['*']) {
            entity["perm_act_0"] = accountPermission.rights.permissions.act['*'];
        }
        else {
            for(let service_name in accountPermission.rights.permissions.act) {
                entity[`perm_act_${service_name}`] = accountPermission.rights.permissions.act[service_name];
            }
        }
    }

    if(typeof accountPermission.rights.permissions.review !== 'undefined' && accountPermission.rights.permissions.review != null) {
        if(accountPermission.rights.permissions.review['*']) {
            entity["perm_review_0"/*\u002A"*/] = accountPermission.rights.permissions.review['*'];
        }
        else {
            for(let service_name in accountPermission.rights.permissions.review) {
                entity[`perm_review_${service_name}`] = accountPermission.rights.permissions.review[service_name];
            }
        }
    }

    console.log('Entity (Rights Definition): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Rights Definition): ' + e);
        return;
    }
}

export async function retrieveRightsDefinition(accountId: string, permissionId: number, table_credentials?: AzureStorageCredentials): Promise<RightsDefinition | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_RIGHTS_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name == 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: RightsDefinitionTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        console.log('Account ID: ' + accountId + ', Prmission ID: ' + permissionId);
        entity = await tableClient.getEntity<RightsDefinitionTableEntity>(accountId, permissionId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occured (Retrieve Rights Definition): ' + e);
        return null;
    }

    const rightsDefinition: RightsDefinition = {
        descriptions: [],
        permissions: {}
    };

    // Loop over all the properties in entity and find ones that match 
    // description:<LOCALE>, perm:approve:<*|PERM>, 
    // perm:change:<*|PERM>, perm:act:<*|PERM>, perm:review:<*|PERM> 
    // and set them appropriately in the returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            // Description Regex
            const description_regex = new RegExp(`/description_*/`);
            
            // Rights Regexs
            const approve_rights_regex = new RegExp(`/perm_approve_*/`);
            const change_rights_regex = new RegExp(`/perm_change_*/`);
            const act_rights_regex = new RegExp(`/perm_act_*/`);
            const review_rights_regex = new RegExp(`/perm_review_*/`);

            if(description_regex.test(key)) {
                const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                const description: Description = {
                    locale: key.substring(key.lastIndexOf('_')) == 'enCA' ? SupportedLocales.english : SupportedLocales.french,
                    value: (entity[objIndex] as string)
                }

                rightsDefinition.descriptions.push(description);
            }
            else if(approve_rights_regex.test(key)) {
                if(typeof rightsDefinition.permissions.approve === 'undefined') {
                    rightsDefinition.permissions.approve = { '*': true };
                }

                if(key.substring(key.lastIndexOf('_')) == '0') {
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.approve as { '*': boolean, [serviceName: string]: boolean })['*'] = (entity[objIndex] as boolean);
                }
                else {
                    // Because explicit rights are specified the overall permission HAS to be false
                    (rightsDefinition.permissions.approve as { '*': boolean, [serviceName: string]: boolean })['*'] = false;
                    // Set the specific right
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.approve as { '*': boolean, [serviceName: string]: boolean })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
                }
            }
            else if(change_rights_regex.test(key)) {
                if(typeof rightsDefinition.permissions.change === 'undefined') {
                    rightsDefinition.permissions.change = { '*': true };
                }
                
                if(key.substring(key.lastIndexOf('_')) == '0') {
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.change as { '*': boolean, [serviceName: string]: boolean })['*'] = (entity[objIndex] as boolean);
                }
                else {
                    // Because explicit rights are specified the overall permission HAS to be false
                    (rightsDefinition.permissions.change as { '*': boolean, [serviceName: string]: boolean })['*'] = false;
                    // Set the specific right
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.change as { '*': boolean, [serviceName: string]: boolean })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
                }
            }
            else if(act_rights_regex.test(key)) {
                if(typeof rightsDefinition.permissions.act === 'undefined') {
                    rightsDefinition.permissions.act = { '*': true };
                }

                if(key.substring(key.lastIndexOf('_')) == '*') {
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.act as { '*': boolean, [serviceName: string]: boolean })['*'] = (entity[objIndex] as boolean);
                }
                else {
                    // Because explicit rights are specified the overall permission HAS to be false
                    (rightsDefinition.permissions.act as { '*': boolean, [serviceName: string]: boolean })['*'] = false;
                    // Set the specific right
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.act as { '*': boolean, [serviceName: string]: boolean })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
                }
            }
            else if(review_rights_regex.test(key)) {
                if(typeof rightsDefinition.permissions.review === 'undefined') {
                    rightsDefinition.permissions.review = { '*': true };
                }

                if(key.substring(key.lastIndexOf('_')) == '*') {
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.review as { '*': boolean, [serviceName: string]: boolean })['*'] = (entity[objIndex] as boolean);
                }
                else {
                    // Because explicit rights are specified the overall permission HAS to be false
                    (rightsDefinition.permissions.review as { '*': boolean, [serviceName: string]: boolean })['*'] = false;
                    // Set the specific right
                    const objIndex: keyof RightsDefinitionTableEntity = key as keyof RightsDefinitionTableEntity;
                    (rightsDefinition.permissions.review as { '*': boolean, [serviceName: string]: boolean })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as boolean);
                }
            }
        }
    )

    console.log('Reconstructed Rights Definition Object: ' + JSON.stringify(rightsDefinition));

    return rightsDefinition;
}

//----------------------------------------------------------------
// Order Properties accessors (getters, setters, mutators, etc...)
//----------------------------------------------------------------

type OrderTableEntity = {
    partitionKey: 'individual' | 'organization',
    rowKey: string,
    purchaser: string,
    "external_stripe_id": string,
    notes?: any
};

export async function saveOrderProperties(order: Order, type: 'individual' | 'organization', table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the order properties isn't defined or is null 
    // just return because there is nothing we can do with that 
    if(typeof order.properties === 'undefined' || order.properties == null) {
        console.log("Can't save anything because the order properties isn't defined or is null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: ORDER_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Order Properties): ' + e);
        return;
    }
    
    const entity: OrderTableEntity = {
        partitionKey: type,
        rowKey: typeof order.id !== 'undefined' ? order.id.toString() : '',
        purchaser: order.properties.purchaser,
        "external_stripe_id": order.properties.stripeId
    };

    if(typeof order.properties.notes !== 'undefined' && order.properties.notes != null) {
        entity["notes"] = order.properties.notes;
    }

    console.log('Entity (Order): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save OrderProperties): ' + e);
        return;
    }
}
export async function retrieveOrderProperties(type: string, orderId: number, table_credentials?: AzureStorageCredentials): Promise<OrderProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: ORDER_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: OrderTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<OrderTableEntity>(type, orderId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd: (Retrieve Order Properties) ' + e);
        return null;
    }

    const returnedOrderProperties: OrderProperties = {
        purchaser: entity["purchaser"],
        stripeId: entity["external_stripe_id"]
    };

    if(typeof entity["notes"] !== 'undefined' && entity["notes"] != null) {
        returnedOrderProperties.notes = entity["notes"];
    }

    console.log('Reconstructed Order Object: ' + JSON.stringify(returnedOrderProperties));

    return returnedOrderProperties;
}

//------------------------------------------------------------------------------------
// Access (AccessToServices) Properties accessors (getters, setters, mutators, etc...)
//------------------------------------------------------------------------------------

type AccessTableEntity = {
    partitionKey: string,
    rowKey: string,
    type: 'individual'|'organization',
    quota_units?: string,
    quota_used?: number,
    quota_max?: number
};

export async function saveAccessProperties(accessToServices: AccessToServices, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the access properties (AccessToServices properties) 
    // isn't defined or is null just return because there is nothing we 
    // can do with that 
    if(typeof accessToServices.properties === 'undefined' || accessToServices.properties == null) {
        console.log("Can't save anything because the access properties aren't defined or are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: ACCESS_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Access Properties): ' + e);
        return;
    }

    let key: string = '';
    if(accessToServices.properties.type == 'individual') {
        key = typeof accessToServices.uId !== 'undefined' ? accessToServices.uId : '';
    }
    else {
        key = typeof accessToServices.aId !== 'undefined' ? accessToServices.aId : '';
    }

    console.log('Key: ' + key);

    const entity: AccessTableEntity = {
        partitionKey: key,
        rowKey: accessToServices.service.id + '_' + accessToServices.order.id,
        type: accessToServices.properties.type
    };

    console.log(JSON.stringify(entity));

    if(typeof accessToServices.properties.units !== 'undefined' && accessToServices.properties.units != null) {
        entity["quota_units"] = accessToServices.properties.units;
    }
    
    if(typeof accessToServices.properties.used !== 'undefined' && accessToServices.properties.used != null) {
        entity["quota_used"] = accessToServices.properties.used;
    }

    if(typeof accessToServices.properties.max !== 'undefined' && accessToServices.properties.max != null) {
        entity["quota_max"] = accessToServices.properties.max;
    }

    console.log('Entity (AccessToServices): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Access Properties): ' + e);
        return;
    }
}
export async function retrieveAccessProperties(purchaserId: string, serviceId: number, orderId: number, table_credentials?: AzureStorageCredentials): Promise<AccessToServicesProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: ACCESS_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    console.log(`Access Properties Table (lib/azure/table-storage/retrieveAccessProperties): ${use_table_credentials.table_name}`);

    let entity: AccessTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<AccessTableEntity>(purchaserId, serviceId.toString() + '_' + orderId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Retrieve Access Properties): ' + e);
        return null;
    }

    const accessProperties: AccessToServicesProperties = {
        type: entity["type"]
    };

    if(typeof entity["quota_units"] !== 'undefined' && entity["quota_units"] != null) {
        accessProperties.units = entity["quota_units"];
    }
    
    if(typeof entity["quota_used"] !== 'undefined' && entity["quota_used"] != null) {
        accessProperties.used = entity["quota_used"];
    }

    if(typeof entity["quota_max"] !== 'undefined' && entity["quota_max"] != null) {
        accessProperties.max = entity["quota_max"];
    }

    console.log('Reconstructed AccessToServicesProperties Object: ' + JSON.stringify(accessProperties));

    return accessProperties;
}

//---------------------------------------------------------------------------
// Service Category Properties accessors (getters, setters, mutators, etc...)
//---------------------------------------------------------------------------

type ServiceCategoryTableEntity = {
    partitionKey: string,
    rowKey: string,
    [key: `name_${string}`]: string,
    [key: `description_${string}`]: string,
};

export async function saveServiceCategoryProperties(serviceCategory: ServiceCategory, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the Service Category's properties isn't defined or is 
    // null just return because there is nothing we can do with that 
    if(typeof serviceCategory.properties === 'undefined' || serviceCategory.properties == null) {
        console.log("Can't save anything because the Service Category's properties aren't defined or are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: SERVICE_CATEGORY_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Service Category Properties): ' + e);
        return;
    }

    const entity: ServiceCategoryTableEntity = {
        partitionKey: serviceCategory.grouping,
        rowKey: typeof serviceCategory.id !== 'undefined' ? serviceCategory.id.toString() : ''
    };

    if(typeof serviceCategory.properties.names !== 'undefined' && serviceCategory.properties.names != null) {
        for(let i = 0;i < serviceCategory.properties.names.length; i++) {
            const objIndex: keyof ServiceCategoryTableEntity = (`name_${serviceCategory.properties.names[i].locale.language}${serviceCategory.properties.names[i].locale.country}` as (keyof ServiceCategoryTableEntity));
            entity[objIndex] = serviceCategory.properties.names[i].value;
        }
    }

    if(typeof serviceCategory.properties.descriptions !== 'undefined' && serviceCategory.properties.descriptions != null) {
        for(let i = 0;i < serviceCategory.properties.descriptions.length;i++) {
            if(typeof serviceCategory.properties.descriptions[i].value !== 'undefined') {
                const objIndex: keyof ServiceCategoryTableEntity = (`description_${serviceCategory.properties.descriptions[i].locale.language}${serviceCategory.properties.descriptions[i].locale.country}` as (keyof ServiceCategoryTableEntity));
                entity[objIndex] = (serviceCategory.properties.descriptions[i].value as string);
            }
        }
    }

    console.log('Entity (Service Category): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Service Category Properties): ' + e);
        return;
    }
}
export async function retrieveServiceCategoryProperties(serviceCategoryGrouping: string, serviceCategoryId: number, table_credentials?: AzureStorageCredentials): Promise<ServiceCategoryProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: SERVICE_CATEGORY_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: ServiceCategoryTableEntity;
    const returnedServiceCategoryProperties: ServiceCategoryProperties = {};

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<ServiceCategoryTableEntity>(serviceCategoryGrouping, serviceCategoryId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Retrieve Service Category Properties): ' + e);
        return null;
    }

    // Loop over all the properties in entity and find ones that match 
    // description:<LOCALE> or names:<LOCALE> and set them in the 
    // returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            const description_regex = new RegExp(/description_*/);
            const name_regex = new RegExp(/name_*/);

            if(description_regex.test(key)) {
                if(typeof returnedServiceCategoryProperties.descriptions === 'undefined') {
                    returnedServiceCategoryProperties.descriptions = [];
                }

                const objIndex: keyof ServiceCategoryTableEntity = key as keyof ServiceCategoryTableEntity;
                const description: Description = {
                    locale: key.substring(key.lastIndexOf('_')) == 'enCA' ? SupportedLocales.english : SupportedLocales.french,
                    value: entity[objIndex]
                }

                returnedServiceCategoryProperties.descriptions.push(description);
            }
            else if(name_regex.test(key)) {
                if(returnedServiceCategoryProperties.names == undefined) {
                    returnedServiceCategoryProperties.names = [];
                }

                const objIndex: keyof ServiceCategoryTableEntity = key as keyof ServiceCategoryTableEntity;
                const name: Name = {
                    locale: key.substring(key.lastIndexOf('_')) == 'enCA' ? SupportedLocales.english : SupportedLocales.french,
                    value: entity[objIndex]
                }

                returnedServiceCategoryProperties.names.push(name);
            }
        }
    )

    //console.log('Reconstructed Service Category Object: ' + JSON.stringify(returnedServiceCategoryProperties));

    return returnedServiceCategoryProperties;
}

//------------------------------------------------------------------
// Service Properties accessors (getters, setters, mutators, etc...)
//------------------------------------------------------------------

type ServiceTableEntity = {
    partitionKey: string,
    rowKey: string,
    usage?: string,
    [key: `name_${string}`]: string,
    [key: `description_${string}`]: string,
    [key: `custom_props_${string}`]: string,
    "external_stripe_id"?: string
};

export async function saveServiceProperties(service: Service, table_credentials?: AzureStorageCredentials): Promise<void> { 
    // Because the Service's properties isn't defined or is 
    // null just return because there is nothing we can do with that 
    if(typeof service.properties === 'undefined' || service.properties == null) {
        console.log("Can't save anything because the Service's properties aren't defined or are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: SERVICE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Service Properties): ' + e);
        return;
    }

    console.log('Service Properties From Parameter (Save Service Properties): ' + JSON.stringify(service.properties));
    
    const entity: ServiceTableEntity = {
        partitionKey: typeof service.category.id !== 'undefined' ? service.category.id.toString() : '',
        rowKey: typeof service.id !== 'undefined' ? service.id.toString() : '',
        usage: service.properties.usage
    };

    if(typeof service.properties.names !== 'undefined' && service.properties.names != null) {
        for(let i = 0;i < service.properties.names.length; i++) {
            const objIndex: keyof ServiceTableEntity = (`name_${service.properties.names[i].locale.language}${service.properties.names[i].locale.country}` as (keyof ServiceTableEntity));
            entity[objIndex] = service.properties.names[i].value;
        }
    }

    if(typeof service.properties.descriptions !== 'undefined' && service.properties.descriptions != null) {
        for(let i = 0;i < service.properties.descriptions.length; i++) {
            if(typeof service.properties.descriptions[i].value !== 'undefined') {
                const objIndex: keyof ServiceTableEntity = (`description_${service.properties.descriptions[i].type}_${service.properties.descriptions[i].locale.language}${service.properties.descriptions[i].locale.country}` as (keyof ServiceTableEntity));
                entity[objIndex] = (service.properties.descriptions[i].value as string);
            }
        }
    }

    if(typeof service.properties.customProperties !== 'undefined' && service.properties.customProperties != null) {
        for(let i = 0;i < service.properties.customProperties.length; i++) {
            const objIndex: keyof ServiceTableEntity = (`custom_props_${service.properties.customProperties[i].name}` as (keyof ServiceTableEntity));
            entity[objIndex] = service.properties.customProperties[i].from;
        }
    }

    if(typeof service.properties.stripeId !== 'undefined' && service.properties.stripeId != null) {
        entity["external_stripe_id"] =  service.properties.stripeId;
    }

    console.log('Entity (Service): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Service Properties): ' + e);
        return;
    }
}
export async function retrieveServiceProperties(serviceCategoryId: number, serviceId: number, table_credentials?: AzureStorageCredentials): Promise<ServiceProperties | null> { 
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: SERVICE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: ServiceTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<ServiceTableEntity>(serviceCategoryId.toString(), serviceId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Retrieve Service Properties): ' + e);
        return null;
    }

    //console.log('From Azure Table Storage (retrieveServiceProperties):' + JSON.stringify(entity));

    const returnedServiceProperties: ServiceProperties = {
        stripeId: typeof entity["external_stripe_id"] !== 'undefined' ? entity["external_stripe_id"] : ''
    };
    
    if(typeof entity["usage"] !== 'undefined' && entity["usage"] != null) {
        returnedServiceProperties.usage = entity["usage"];
    }

    // Loop over all the properties in entity and find ones that match 
    // description:<LOCALE> or names:<LOCALE> and set them in the 
    // returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            const description_regex = new RegExp(`description_*`);
            const name_regex = new RegExp(`name_*`);
            const custom_prop_regex = new RegExp(`custom_props_*`);
            
            if(description_regex.test(key)) {
                if(returnedServiceProperties.descriptions == undefined) {
                    returnedServiceProperties.descriptions = [];
                }

                const objIndex: keyof ServiceTableEntity = key as keyof ServiceTableEntity;
                const description: Description = {
                    locale: key.substring(key.lastIndexOf('_') + 1) == 'enCA' ? SupportedLocales.english : SupportedLocales.french,
                    value: entity[objIndex]
                }

                returnedServiceProperties.descriptions.push(description);
            }
            else if(name_regex.test(key)) {
                if(returnedServiceProperties.names == undefined) {
                    returnedServiceProperties.names = [];
                }

                const lang = key.substring(key.lastIndexOf('_') + 1) == 'enCA' ? SupportedLocales.english : SupportedLocales.french;

                const objIndex: keyof ServiceTableEntity = key as keyof ServiceTableEntity;
                const name: Name = {
                    locale: lang,
                    value: (entity[objIndex] as string)
                }

                returnedServiceProperties.names.push(name);
            }
            else if(custom_prop_regex.test(key)) {
                if(returnedServiceProperties.customProperties == undefined) {
                    returnedServiceProperties.customProperties = [];
                }

                const objIndex: keyof ServiceTableEntity = key as keyof ServiceTableEntity;
                returnedServiceProperties.customProperties.push({
                    name: key.substring('custom_props_'.length),
                    from: (entity[objIndex] as string)
                });
            }
        }
    )

    //console.log('Reconstructed Service Object (Retrieve Service Properties - Test): ' + JSON.stringify(returnedServiceProperties));

    return returnedServiceProperties;
}

//----------------------------------------------------------------
// Price Properties accessors (getters, setters, mutators, etc...)
//----------------------------------------------------------------

type PriceTableEntity = {
    partitionKey: string,
    rowKey: string,
    type: 'one-time' | 'subscription',
    name?: string,
    frequency?: string,
    "external_stripe_id"?: string
};

export async function savePriceProperties(price: Price, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the Price's properties isn't defined or is 
    // null just return because there is nothing we can do with that 
    if(typeof price.properties === 'undefined' || price.properties == null) {
        console.log("Can't save anything because the Price's properties aren't defined or are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: PRICE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Save Price Properties): ' + e);
        return;
    }
    
    const entity: PriceTableEntity = {
        partitionKey: price.currency,
        rowKey: typeof price.id !== 'undefined' ? price.id.toString() : '',
        type: price.properties.type,
    }

    if(typeof price.properties.name !== 'undefined' && price.properties.name != null) {
        entity["name"] = price.properties.name;
    }

    if(typeof price.properties.frequency !== 'undefined' && price.properties.frequency != null) {
        entity["frequency"] = price.properties.frequency;
    }

    if(typeof price.properties.stripeId !== 'undefined' && price.properties.stripeId != null) {
        entity["external_stripe_id"] = price.properties.stripeId;
    }

    console.log('Entity (Price): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Price Properties): ' + e);
        return;
    }
}
export async function retrievePriceProperties(currency: string, priceId: number, table_credentials?: AzureStorageCredentials): Promise<PriceProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: PRICE_PROPERTIES_TABLE,
            storage_account_name: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: SYSTEM_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: PriceTableEntity;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<PriceTableEntity>(currency, priceId.toString());
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd (Retrieve Price Properties): ' + e);
        return null;
    }

    const returnedPriceProperties: PriceProperties = {
        name: typeof entity["name"] !== 'undefined' ? entity["name"] : '',
        type: entity["type"],
        stripeId: typeof entity["external_stripe_id"] !== 'undefined' ? entity["external_stripe_id"] : ''
    };

    if(typeof entity["frequency"] !== 'undefined' && entity["frequency"] != null) {
        returnedPriceProperties.frequency = entity["frequency"];
    }

    //console.log('Reconstructed Price Object: ' + JSON.stringify(returnedPriceProperties));

    return returnedPriceProperties;
}

//==================================================================
// Account/User Specific
//==================================================================

//------------------------------------------------------------------
// Account Properties accessors (getters, setters, mutators, etc...)
//------------------------------------------------------------------

type AccountTableEntity = {
    partitionKey: string,
    rowKey: string,
    [key: `description_${string}`]: string,
    "external_stripe_id"?: string
};

export async function saveAccountProperties(account: Account, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the account properties isn't defined or is null 
    // just return because there is nothing we can do with that 
    if(typeof account.properties === 'undefined' || account.properties == null) {
        console.log("Can't save anything because the properties of the account provided aren't defined or are null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_ACCOUNT_PROPERTIES_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occured (Table Save Properties): ' + e);
        return;
    }
    
    const entity: AccountTableEntity = {
        partitionKey: typeof account.organization !== 'undefined' ? account.organization : '',
        rowKey: typeof account.id !== 'undefined' ? account.id : ''
    };

    if(typeof account.properties.descriptions !== 'undefined' && account.properties.descriptions != null) {
        for(let i = 0;i < account.properties.descriptions.length;i++) {
            if(typeof account.properties.descriptions[i].value !== 'undefined') {
                const objIndex: keyof AccountTableEntity = (`description_${account.properties.descriptions[i].locale.language}${account.properties.descriptions[i].locale.country}` as (keyof AccountTableEntity));
                entity[objIndex] = (account.properties.descriptions[i].value as string);
            }
        }
    }

    if(typeof account.properties.stripeId !== 'undefined' && account.properties.stripeId != null) {
        entity["external_stripe_id"] = account.properties.stripeId;
    }

    console.log('Entity (Account): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write (Save Account Properties): ' + e);
        return;
    }
}
export async function retrieveAccountProperties(organization: string, accountId: string, table_credentials?: AzureStorageCredentials): Promise<AccountProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_ACCOUNT_PROPERTIES_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: AccountTableEntity;
    const returnedAccountProperties: AccountProperties = {};

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        entity = await tableClient.getEntity<AccountTableEntity>(organization, accountId);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occured (Retrieve Account Properties): ' + e);
        return null;
    }

    if(typeof entity["external_stripe_id"] !== 'undefined' && entity["external_stripe_id"] != null) {
        returnedAccountProperties.stripeId = entity["external_stripe_id"];
    }

    // Loop over all the properties in entity and find ones that match 
    // description:<LOCALE> and set them in the returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            const description_regex = new RegExp(`/description_*/`)
            
            if(description_regex.test(key)) {
                const objIndex: keyof AccountTableEntity = key as keyof AccountTableEntity;
                const description: Description = {
                    locale: key.substring(key.lastIndexOf('_')) == 'enCA' ? SupportedLocales.english : SupportedLocales.french,
                    value: entity[objIndex]
                }

                if(typeof returnedAccountProperties.descriptions === 'undefined') {
                    returnedAccountProperties.descriptions = [];
                }

                (returnedAccountProperties.descriptions as Description[]).push(description);
            }
        }
    )

    console.log('Reconstructed Account Properties Object: ' + JSON.stringify(returnedAccountProperties));

    return returnedAccountProperties;
}

//----------------------------------------------------------------
// User Properties accessors (getters, setters, mutators, etc...)
//----------------------------------------------------------------

type UserTableEntity = {
    partitionKey: string,
    rowKey: string,
    name_0?: string,
    name_fname?: string,
    name_lname?: string,
    pronouns_0?: string,
    pronouns_referral?: 'he' | 'she' | 'them',
    pronouns_singular?: 'him' | 'her' | 'them',
    pronouns_posessive?: 'his' | 'hers' | 'theirs',
    avatar?: string,
    lang_0?: string,
    [key: `lang_page_${string}`]: string,
    [key: `lang_service_${string}`]: string,
    "external_stripe_id"?: string
};

export async function saveUserProperties(user: User, table_credentials?: AzureStorageCredentials): Promise<void> {
    // Because the user properties isn't defined or is null 
    // just return because there is nothing we can do with that 
    if(typeof user.properties === 'undefined' || user.properties == null) {
        console.log("Can't save anything because properties on this user are undefined or null");
        return;
    }

    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_USER_PROPERTIES_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY,
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return;
    }

    let tableClient: TableClient;

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occurd: ' + e);
        return;
    }
    
    
    const entity: UserTableEntity = {
        partitionKey: typeof user.account !== 'undefined' ? typeof user.account.id !== 'undefined' ? user.account.id : '' : '',
        rowKey: typeof user.id !== 'undefined' ? user.id : '',
    };

    if(typeof user.properties.name !== 'undefined' && user.properties.name != null) {
        if(typeof(user.properties.name) === 'string') {
            entity["name_0"] = user.properties.name;
        }
        else {
            entity["name_fname"] = user.properties.name.fname;
            entity["name_lname"] = user.properties.name.lname;
        }
    }

    if(typeof user.properties.pronouns !== 'undefined' && user.properties.pronouns != null) {
        if(typeof(user.properties.pronouns) === 'string') {
            entity["pronouns_0"] = user.properties.pronouns;
        }
        else {
            entity["pronouns_referral"] = user.properties.pronouns.referral;
            entity["pronouns_singular"] = user.properties.pronouns.singular;
            entity["pronouns_posessive"] = user.properties.pronouns.posessive;
        }
    }

    if(typeof user.properties.avatar !== 'undefined' && user.properties.avatar != null) {
        entity["avatar"] = user.properties.avatar;
    }

    if(typeof user.properties.lang !== 'undefined') {
        if(typeof user.properties.lang["*"] !== 'undefined' && user.properties.lang["*"] != null) {
            entity["lang_0"] = user.properties.lang["*"];
        }

        if(typeof user.properties.lang.pages !== 'undefined' && user.properties.lang.pages != null) {
            for(let page_name in user.properties.lang.pages) {
                const objIndex: keyof UserTableEntity = (`lang_page_${page_name}` as (keyof UserTableEntity));
                (entity[objIndex] as string) = (user.properties.lang.pages[page_name] as string);
            }
        }

        if(typeof user.properties.lang.services !== 'undefined' && user.properties.lang.services != null) {
            for(let service_name in user.properties.lang.services) {
                const objIndex: keyof UserTableEntity = (`lang_service_${service_name}` as (keyof UserTableEntity));
                (entity[objIndex] as string) = (user.properties.lang.services[service_name] as string);
            }
        }
    }

    if(typeof user.properties.stripeId !== 'undefined' && user.properties.stripeId != null) {
        entity["external_stripe_id"] = user.properties.stripeId;
    }

    console.log('Entity (User): ' + JSON.stringify(entity));

    try {
        // Put the entry in the table
        await tableClient.createEntity(entity);
    }
    catch(e) {
        // ERROR: an error occured while attempt to write to Azure Table Storage
        console.log('An error occured while attempting to write: ' + e);
        return;
    }
}
export async function retrieveUserProperties(accountId: string, userId: string, table_credentials?: AzureStorageCredentials): Promise<UserProperties | null> {
    // Setup the default values unless something was specified
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: DEFAULT_USER_PROPERTIES_TABLE,
            storage_account_name: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_NAME,
            storage_key: ACCOUNT_PROPERTIES_STORAGE_ACCOUNT_KEY,
        },
        table_credentials
    );

    // Ensure we have all the credentials we need
    if(
        (typeof use_table_credentials.storage_account_name === 'undefined' || use_table_credentials.storage_account_name == null) &&
        (typeof use_table_credentials.storage_key === 'undefined' || use_table_credentials.storage_key == null) && 
        (typeof use_table_credentials.storage_url === 'undefined' || use_table_credentials.storage_url == null) && 
        (typeof use_table_credentials.table_name === 'undefined' || use_table_credentials.table_name == null)
    ) {
        console.log('Not all the proper credentials are set');
        return null;
    }

    let entity: UserTableEntity;
    const returnedUserProperties: UserProperties = {};

    // Verify we can establish a connection to Azure Table Storage
    try {
        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
        const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);
        
        console.log('Attempting to retrieve: (' + accountId + ', ' + userId + ')');
        
        entity = await tableClient.getEntity<UserTableEntity>(accountId, userId);
    }
    catch(e) {
        // ERROR: There was an error with connection to the Azure Table Storage
        console.log('An error occured (Retrieve User Properties): ' + e);
        return null;
    }

    if(typeof entity["name_0"] !== 'undefined' && entity["name_0"] != null) {
        returnedUserProperties.name = entity["name_0"];
    }
    else {
        returnedUserProperties.name = {
            fname: typeof entity["name_fname"] !== 'undefined' ? entity["name_fname"] : '',
            lname: typeof entity["name_lname"] !== 'undefined' ? entity["name_lname"] : ''
        };
    }

    if((typeof entity["pronouns_0"] !== 'undefined' && entity["pronouns_0"] != null) || 
        (
            (typeof entity["pronouns_referral"] !== 'undefined' && entity["pronouns_referral"] != null) &&
            (typeof entity["pronouns_singular"] !== 'undefined' && entity["pronouns_singular"] != null) &&
            (typeof entity["pronouns_posessive"] !== 'undefined' && entity["pronouns_posessive"] != null)
        )
    ) {
        if(typeof entity["pronouns_0"] !== 'undefined' && entity["pronouns_0"] != null) {
            returnedUserProperties.pronouns = entity["pronouns_0"];
        }
        else {
            // Note, casting here because default value isn't possible
            returnedUserProperties.pronouns = {
                referral: (entity["pronouns_referral"] as 'he' | 'she' | 'them'),
                singular: (entity["pronouns_singular"] as 'him' | 'her' | 'them'),
                posessive: (entity["pronouns_posessive"] as 'his' | 'hers' | 'theirs')
            };
        }
    }

    if(typeof entity["avatar"] !== 'undefined' && entity["avatar"] != null) {
        returnedUserProperties.avatar = entity["avatar"];
    }

    if(typeof entity["lang_0"] !== 'undefined' && entity["lang_0"] != null) {
        returnedUserProperties.lang = {
            '*': entity["lang_0"]
        };
    }

    // Loop over all the properties in entity and find ones that match 
    // lang:page:<PAGE> or lang:service:<SERVICE> and set them in the 
    // returned object
    Object.keys(entity).forEach(
        (key: string, index: number) => {
            const page_regex = new RegExp(`/lang_page_*/`)
            const service_regex = new RegExp(`/lang_service_*/`)
            
            if(page_regex.test(key)) {
                if(typeof returnedUserProperties.lang === 'undefined') {
                    returnedUserProperties.lang = { "*": '' };
                }
                const typedLang: { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } } = (returnedUserProperties.lang as { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } });
                
                if(typeof typedLang.pages === 'undefined') {
                    (returnedUserProperties.lang as { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } }).pages = {};
                }

                const objIndex: keyof UserTableEntity = key as keyof UserTableEntity;
                (returnedUserProperties.lang.pages as { [page_name: string]: string })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as string);
            }
            else if(service_regex.test(key)) {
                if(typeof returnedUserProperties.lang === 'undefined') {
                    returnedUserProperties.lang = { "*": '' };
                }
                const typedLang: { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } } = (returnedUserProperties.lang as { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } });
                
                if(typeof typedLang.services === 'undefined') {
                    (returnedUserProperties.lang as { "*": string, pages?: { [page_name: string]: string }, services?: { [service_name: string]: string } }).services = {};
                }
                
                const objIndex: keyof UserTableEntity = key as keyof UserTableEntity;
                (returnedUserProperties.lang.services as { [service_name: string]: string })[key.substring(key.lastIndexOf('_'))] = (entity[objIndex] as string);
            }
        }
    )

    if(typeof entity["external_stripe_id"] !== 'undefined' && entity["external_stripe_id"] != null) {
        returnedUserProperties.stripeId = entity["external_stripe_id"];
    }

    console.log('Reconstructed User Properties Object: ' + JSON.stringify(returnedUserProperties));

    return returnedUserProperties;
}

//============================================================
// Service Spcific
//============================================================

//------------------------------------------------------------
// Video Editing Service
//------------------------------------------------------------

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// User Token accessors (getters, setters, mutators, etc...)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

export function createUserToken() {
}

export async function getUserTokens(user: User, table_credentials?: AzureStorageCredentials): Promise<GetTableEntityResponse<TableEntityResult<Record<string, unknown>>> | null> {
    // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
    const use_table_credentials: AzureStorageCredentials = ensureCredentials(
        {
            table_name: VIDEO_EDITING_TOKENS_TABLE_NAME,
            storage_key: VIDEO_EDITING_STORAGE_ACCOUNT_KEY,
            storage_account_name: VIDEO_EDITING_STORAGE_ACCOUNT_NAME
        },
        table_credentials
    );

    // Create the Azure Table Client
    const tableCredential = new AzureNamedKeyCredential(use_table_credentials.storage_account_name, use_table_credentials.storage_key);
    const tableClient = new TableClient((use_table_credentials.storage_url as string), use_table_credentials.table_name, tableCredential);

    console.log('Attempting to get secrets for user: ' + JSON.stringify(user));

    var entity: GetTableEntityResponse<TableEntityResult<Record<string, unknown>>> | null = null;
    try {
        const accId: string = typeof user.aId !== 'undefined' ? user.aId : '';
        const userId: string = typeof user.id !== 'undefined' ? user.id : '';
        entity = await tableClient.getEntity(accId, userId);
    }
    catch(e) {
        console.log('An error occured while attempting to retireve secrets ' + e);
    }
    
    return entity;
}