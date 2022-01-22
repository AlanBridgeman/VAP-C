import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

export default async function handler(req, res) {
    // Needed YouTube credentials loaded from environment variables (for security)
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
    const YOUTUBE_TOKEN_URI = process.env.YOUTUBE_TOKEN_URI;
    const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

    // Needed Azure Key Vault credentials loaded from environment variables (for security)
    const KEYVAULT_NAME = process.env.KEYVAULT_NAME;
    const KEYVAULT_TENANT_ID = process.env.KEYVAULT_TENANT_ID;
    const KEYVAULT_CLIENT_ID = process.env.KEYVAULT_CLIENT_ID;
    const KEYVAULT_CLIENT_SECRET =  process.env.KEYVAULT_CLIENT_SECRET;
    
    // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
    const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
    const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;
    const STORAGE_TABLE_NAME = process.env.STORAGE_TABLE_NAME;

    // Setup payload (required parameters/info) for the YouTube/Google API token request
    const token_request_payload = {
        grant_type: 'authorization_code',
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        redirect_uri: YOUTUBE_REDIRECT_URI,
        code: req.query.code
    }
    
    // Make the token request to the YouTube/Google API
    const result = await fetch(YOUTUBE_TOKEN_URI, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(token_request_payload)
    })
    .then(r => r.json())
    .then(async data => {
        // Create the Key Vault Client
        const secretCredential = new ClientSecretCredential(KEYVAULT_TENANT_ID, KEYVAULT_CLIENT_ID, KEYVAULT_CLIENT_SECRET);
        const url = "https://" + KEYVAULT_NAME + ".vault.azure.net";
        const secretClient = new SecretClient(url, secretCredential);
        
        // Create Key Vault secrets for the YouTube Access Token and Refresh Token
        const uniqueString = new Date().getTime();
        const tokenSecretName = `youtube-token-${uniqueString}`;
        const refreshTokenSecretName = `youtube-refresh-token-${uniqueString}`;
        const tokenResult = await secretClient.setSecret(tokenSecretName, data.access_token);
        const refreshResult = await secretClient.setSecret(refreshTokenSecretName, data.refresh_token);
        
        const table_name = 'userTokens';

        // Create the Azure Table Client
        const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
        const tableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, STORAGE_TABLE_NAME, tableCredential);
        
        // Create the entry to put in the table
        // 
        // NOTE: I use the "Account*" as the partitionKey and "User*" as 
        //       the rowKey (which are the only requireed fields). This is 
        //       because all entries with the same partitionKey are to be 
        //       served by the same partition server where rowKey is 
        //       intended to identifiy a single row (or the combination of 
        //       the parititionKy and rowKey is)
        //       
        //       See: https://docs.microsoft.com/en-us/rest/api/storageservices/designing-a-scalable-partitioning-strategy-for-azure-table-storage
        const testEntity = {
            partitionKey: "Account1",
            rowKey: "User1",
            token: tokenResult.name,
            refresh: refreshResult.name,
            approver: "a.bridgeman@hotmail.com"
        };
        
        // Put the entry in the table
        await tableClient.createEntity(testEntity);

        // TO-DO: Implement an actual user system based on cookies
        /*res.cookie('kushyFToken', data.access_token, {
            maxAge: 900000,
            httpOnly: true
        });*/

        // 
        return { user: "user1"}
    });

    res.redirect("/dashboard?user=" + result.user)
}