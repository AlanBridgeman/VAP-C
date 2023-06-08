import { NextApiResponse } from 'next';

// Load the required libraries for Azure Table access
import { GetTableEntityResponse, TableEntityResult, TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
// Load the required libraries for Azure Key Vault
import { SecretClient, KeyVaultSecret } from '@azure/keyvault-secrets';
import { ClientSecretCredential } from '@azure/identity';

import { useAuthMiddleware } from '../../middleware/handler';

import ExtendedRequest from '../../types/ExtendedRequest';
import { User } from '../../types/User';
import { Token } from '../../types/Token';

type TokenTableEntity = {
    token: string,
    refresh: string,
    approver: string
};

async function handle(req: ExtendedRequest, res: NextApiResponse<{ tokens: Token[]}>) {
    if(
        typeof process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME !== 'undefined' && 
        typeof process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY !== 'undefined' &&
        typeof process.env.VIDEO_EDITING_STORAGE_TABLE_NAME !== 'undefined' &&
        typeof process.env.VIDEO_EDITING_KEYVAULT_NAME !== 'undefined' &&
        typeof process.env.VIDEO_EDITING_KEYVAULT_TENANT_ID !== 'undefined' &&
        typeof process.env.VIDEO_EDITING_KEYVAULT_CLIENT_ID !== 'undefined' &&
        typeof process.env.VIDEO_EDITING_KEYVAULT_CLIENT_SECRET !== 'undefined'
    ) {
        // Needed Azure Table Storage (part of Azure Storage Account) credentials 
        // loaded from environment variables (for security)
        const STORAGE_ACCOUNT_NAME: string = (process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME as string);
        const STORAGE_ACCOUNT_KEY: string = (process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY as string);
        const STORAGE_TABLE_NAME: string = (process.env.VIDEO_EDITING_STORAGE_TABLE_NAME as string);
        
        // Azure Key Vault Credentials from environment variables (for security)
        const KEYVAULT_NAME: string = (process.env.VIDEO_EDITING_KEYVAULT_NAME as string);
        const KEYVAULT_TENANT_ID: string = (process.env.VIDEO_EDITING_KEYVAULT_TENANT_ID as string);
        const KEYVAULT_CLIENT_ID: string = (process.env.VIDEO_EDITING_KEYVAULT_CLIENT_ID as string);
        const KEYVAULT_CLIENT_SECRET: string =  (process.env.VIDEO_EDITING_KEYVAULT_CLIENT_SECRET as string);
        
        // Create the Azure Table Client
        const tableCredential: AzureNamedKeyCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
        const tableClient: TableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, STORAGE_TABLE_NAME, tableCredential);

        // Note, we can assume it's a valid user because we wouldn't get this far if it wasn't
        const user: User = req.user as User;

        //const user = req.query.user;
        const entity: GetTableEntityResponse<TableEntityResult<TokenTableEntity>> = await tableClient.getEntity<TokenTableEntity>(user.account.id, user.id);

        // Create the Key Vault Client
        const secretCredential = new ClientSecretCredential(KEYVAULT_TENANT_ID, KEYVAULT_CLIENT_ID, KEYVAULT_CLIENT_SECRET);
        const url = "https://" + KEYVAULT_NAME + ".vault.azure.net";
        const secretClient = new SecretClient(url, secretCredential);
        
        // Read the secret we created
        const tokenSecret: KeyVaultSecret = await secretClient.getSecret(entity.token);
        const refreshSecret: KeyVaultSecret = await secretClient.getSecret(entity.refresh);
        

        // Create Key Vault secrets for the YouTube Access Token and Refresh Token
        //const uniqueString = new Date().getTime();
        //const tokenSecretName = `youtube-token-${uniqueString}`;
        //const refreshTokenSecretName = `youtube-refresh-token-${uniqueString}`;
        //const tokenResult = await secretClient.setSecret(tokenSecretName, data.access_token);
        //const refreshResult = await secretClient.setSecret(refreshTokenSecretName, data.refresh_token);
        
        const token: Token = {
            secret: {
                name: tokenSecret.name,
                value: tokenSecret.value
            }, 
            refresh: {
                name: refreshSecret.name,
                value: refreshSecret.value
            },
            approver_email: entity.approver
        };

        res.status(200).json({ tokens: [token] });
    }
}

export default useAuthMiddleware<{ tokens: Token[] }>(handle, 'GET');