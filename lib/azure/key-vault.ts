/*
 *************************************************************
 * Name: key-vault.ts (Azure Key Vault/AKV Access)
 * Description: This file is intended to provide centralized 
 *              functionality for accessing Azure Key Vault 
 *              so that the specifics around how to connect 
 *              to AKV (particularly credentials etc...) are 
 *              abstracted away from other business logic and 
 *              front-end code
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

// Load the required libraries for Azure Key Vault
import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { ClientSecretCredential } from '@azure/identity';

import merge from 'lodash.merge';

import { getUserTokens } from './table-storage';
import { User } from '../../types/User';
import { get_db_adapter } from '../db';
import { GetTableEntityResponse, TableEntityResult } from '@azure/data-tables';

//============================================================
// Default Connection Constants
//============================================================
// Azure Key Vault Credentials from environment variables (for security)

const KEYVAULT_NAME = process.env.VIDEO_EDITING_KEYVAULT_NAME;
const KEYVAULT_TENANT_ID = process.env.VIDEO_EDITING_KEYVAULT_TENANT_ID;
const KEYVAULT_CLIENT_ID = process.env.VIDEO_EDITING_KEYVAULT_CLIENT_ID;
const KEYVAULT_CLIENT_SECRET =  process.env.VIDEO_EDITING_KEYVAULT_CLIENT_SECRET;

//============================================================
// Type Definitions
//============================================================

interface AzureKeyVaultCredentials {
    tenant_id: string,
    client_id: string,
    client_secret: string,
    vault_name: string,
    url?: string
}

//============================================================
// Helper Functions (functionality used in multiple function)
//============================================================

/**
 * Helper functions to filter and organize the Table Storage 
 * record to only get the tokens and refresh tokens (broken 
 * down by associated service). In other words, get rid of 
 * all the extra stuff that may exist on a Video Editing 
 * Table Storage (NoSQL) record and organize it:
 * {
 *     '<SERVICE_NAME>': {
 *         'token': '<TOKEN_SECRET_POINTER>',
 *         'refresh': '<REFRESH_TOKEN_SECRET_POINTER>'
 *     }
 * }
 * This is so that it's easier to loop over the returned result 
 * set by service and get both the token and refresh token at 
 * once rather than having to go over all tokens to find the 
 * token and refresh token
 * 
 * @param entity - The entity to be filtered
 * @returns object - The filtered object
 */
 function findTokens(entity: object): object {
    // Get a list of all properties (specifically their names)
    const propNames = Object.keys(entity);

    // Create a new object to ONLY hold the stuff we want to keep
    const props = {};

    // Loop over the properties on the object and disregard any Azur specific stuff
    propNames.forEach(
        (prop_name: string, index: number) => {
            // Find only those "properties" that match _token and 
            // _refresh (the token and refresh token)
            if(prop_name.match(new RegExp('_token')) || prop_name.match(new RegExp('_refresh'))) {
                // Add to the filtered object an array by service.
                // That is if we have youtube_token and 
                // youtube_refresh. Than we want:
                // {
                //     'youtube': {
                //          'token': '<TOKEN_SECRET_POINTER>',
                //          'refresh': '<REFRESH_TOKEN_SECRET_POINTER>'
                //      }
                // }
                // This is for convenience of keeping data easily 
                // organized/referencable without having to look 
                // through each token and refresh token (because 
                // we often want to load them together raather 
                // than seperately)
                props[prop_name.substring(0, prop_name.indexOf('_'))] = props[prop_name.substring(0, prop_name.indexOf('_'))] ? merge(props[prop_name.substring(0, prop_name.indexOf('_'))], {[prop_name.substring(prop_name.indexOf('_') + 1)]: entity[prop_name]}) : {[prop_name.substring(prop_name.indexOf('_') + 1)]: entity[prop_name]};
            }
        }
    );

    // Return the newly filtered list of properties
    return props;
}

/** 
 * Setup default values for credentials to key vault
 * 
 * @param default_creds
 * @param creds
 * @return 
 */
 function ensureCredentials(default_creds: AzureKeyVaultCredentials, creds?: AzureKeyVaultCredentials): AzureKeyVaultCredentials {
    // Because credentials isn't set, set it to the default
    if(!creds) {
        creds = default_creds;
    }

    // If the optional field isn't set (regardless if it was provided by 
    // the user or the default) set it appropriately.
    // Note: This value is special in that it uses anoter of the values 
    //       within the object to define itself which makes it difficult to 
    //       inline this definition
    if(!creds.url) {
        creds.url = "https://" + creds.vault_name + ".vault.azure.net";
    }

    return creds;
}

//============================================================
// User Token accessors (getters, setters, mutators, etc...)
//============================================================

/**
 * Get any tokens associated with any user's on the provided account in 
 * theory this will be used to access tokens that should be available to 
 * all or some subset of users on a given account but currently this 
 * implementation is missing this security component (as currently there is 
 * no rights/access properties)
 * 
 * @param {string} account_id                              - The ID of the account to get the tokens for
 * @param {AzureKeyVaultCredentials} keyvault_credentials  - Key Vault credentils (if different than default)
 * @returns An object/dictionary of users associated with their tokens
 */
 export async function getAllAccountTokens(account_id: string, keyvault_credentials?: AzureKeyVaultCredentials): Promise<object> {
    // Verify we have Keyvault Credentials to make requests, etc...
    const use_keyvault_credentials = ensureCredentials(
        {
            tenant_id: KEYVAULT_TENANT_ID,
            client_id: KEYVAULT_CLIENT_ID,
            client_secret: KEYVAULT_CLIENT_SECRET,
            vault_name: KEYVAULT_NAME
        }, 
        keyvault_credentials
    );

    // Get the users associated with this account
    const users: User[] = await (await get_db_adapter()).getUsersInAccount(account_id);

    // Keep a list of tokens (associated with a user) found so far
    const account_tokens = {};

    // Make sure we wait for all token finds to be "resolved" before moving 
    // on
    await Promise.all(
        // Loop over the list of users associated with the account
        users.map(
            async (user: User, index: number): Promise<void> => {
                // Get the tokens record from Azure Table Storage
                const entity = await getUserTokens(user);

                console.log('Getting properties from video service table: ' + JSON.stringify(entity));

                // Create the Key Vault Client
                const secretCredential = new ClientSecretCredential(use_keyvault_credentials.tenant_id, use_keyvault_credentials.client_id, use_keyvault_credentials.client_secret);
                const url = use_keyvault_credentials.url;
                const secretClient = new SecretClient(url, secretCredential);

                // Filter and organize the results
                const tokenTypes = findTokens(entity);

                // Loop over the result set and get the secrets from Key Vault accordingly
                const tokens: object = {};
                await Promise.all(
                    Object.keys(tokenTypes).map(
                        async (service_name, index): Promise<void> => {
                            console.log(`Looking for ${service_name}_token and ${service_name}_refresh in: ` + JSON.stringify(entity));
                            console.log(`Looking for token and refresh in: ` + JSON.stringify(tokenTypes[service_name]));

                            // Create object to hold the token etc...
                            // 
                            // Note, we create it as a blank object here so 
                            // that we can dynamically set the properties 
                            // on it later when we know what information we 
                            // have (ex. we may NOT have a refresh token 
                            // consequently if we tried to set it an error 
                            // would occur but with this strategy that 
                            // won't happen)
                            // 
                            // In theory the token property should always 
                            // be set but...
                            tokens[service_name] = {};

                            // Assign the token value to the appropriate property
                            if(tokenTypes[service_name].token) {
                                tokens[service_name].token = (await secretClient.getSecret(tokenTypes[service_name].token)).value;
                                console.log('Just set tokens[' + service_name + '].token to ' + JSON.stringify(tokens[service_name].token));
                            }
                            else {
                                throw 'The token has to be set for the service to be associated!';
                            }
                            
                            // Assign the refresh token value IF IT EXISTS
                            if(tokenTypes[service_name].refresh) {
                                tokens[service_name].refresh = (await secretClient.getSecret(tokenTypes[service_name].refresh)).value;
                                console.log('Just set tokens[' + service_name + '].refresh to ' + JSON.stringify(tokens[service_name].refresh));
                            }
                        }
                    )
                );

                // Add the tokens associated with this user to the set/dictionary
                account_tokens[user.id] = tokens;
            }
        )
    );

    return account_tokens;
}

/**
 * Gets the provided user's tokens related to the provided service
 * 
 * @param user                  - The user to get the tokens for
 * @param service_name          - The name of service to get tokens for
 * @param keyvault_credentials  - Key Vault credentils (if different than default)
 * @returns An object that contains the token and potentially a refresh token and expiry for the token if applicable (it's important to note the inclusion of the expiry here because even though there is an expiry associated with the secret it's unclear the granularity of this)
 */
export async function getServiceTokens(user: User, service_name: string, keyvault_credentials?: AzureKeyVaultCredentials): Promise<{token: KeyVaultSecret, refresh?: KeyVaultSecret, expiry?: Date}> {
    const use_keyvault_credentials = ensureCredentials(
        {
            tenant_id: KEYVAULT_TENANT_ID,
            client_id: KEYVAULT_CLIENT_ID,
            client_secret: KEYVAULT_CLIENT_SECRET,
            vault_name: KEYVAULT_NAME
        }, 
        keyvault_credentials
    );

    // Get the secret names from the Azure Table Storage
    const entity: GetTableEntityResponse<TableEntityResult<Record<string, unknown>>> = await getUserTokens(user);

    // Because an error occured populate it up and halt processing
    if(entity == null) {
        return null;
    }

    console.log('Getting properties from video service table: ' + JSON.stringify(entity));
    
    // Create the Key Vault Client
    const secretCredential = new ClientSecretCredential(use_keyvault_credentials.tenant_id, use_keyvault_credentials.client_id, use_keyvault_credentials.client_secret);
    const url = use_keyvault_credentials.url;
    const secretClient = new SecretClient(url, secretCredential);

    console.log(`Looking for ${service_name}_token and ${service_name}_refresh in: ` + JSON.stringify(entity));
    
    // Read the secret we created
    const token: KeyVaultSecret = await secretClient.getSecret((entity[`${service_name}_token`] as string));
    const refresh: KeyVaultSecret = await secretClient.getSecret((entity[`${service_name}_refresh`] as string));

    console.log('Timestamp: ' + entity.timestamp);
    console.log('Expires In: ' + entity.expires_in)
    const msUntilExpiry: number = (entity.expires_in as number) * 1000;
    const tokenExpiry = new Date(new Date(entity.timestamp).getTime() + msUntilExpiry);
    return {token: token, refresh: refresh, expiry: tokenExpiry};
}