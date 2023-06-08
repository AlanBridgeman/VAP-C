import { NextApiResponse } from "next";
import nextConnect from 'next-connect';
import { SecretClient } from "@azure/keyvault-secrets";
import { ClientSecretCredential } from "@azure/identity";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";
import { v4 as newUUID } from 'uuid';
import auth from '../../middleware/auth';
import ExtendedRequest from "../../types/ExtendedRequest";

const handler = nextConnect<ExtendedRequest, NextApiResponse>({
    onError: (error, req: ExtendedRequest, res: NextApiResponse) => {
        console.log(error);
        res.status(501).json({ error: `Sorry something Happened! ${error.message} ${error}` });
    },
    onNoMatch: (req: ExtendedRequest, res: NextApiResponse) => {
        res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    }
});

handler
    .use(auth) // Use auth middleware so that the user is accessible via the request object
    .get(
        async (req: ExtendedRequest, res: NextApiResponse) => {
            // Needed YouTube credentials loaded from environment variables (for security)
            const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
            const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
            const YOUTUBE_TOKEN_URI = process.env.YOUTUBE_TOKEN_URI;
            const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;
            const YOUTUBE_APP_VERIFIED = process.env.YOUTUBE_APP_VERIFIED;

            // Needed Azure Key Vault credentials loaded from environment variables (for security)
            const KEYVAULT_NAME = process.env.VIDEO_EDITING_KEYVAULT_NAME;
            const KEYVAULT_TENANT_ID = process.env.VIDEO_EDITING_KEYVAULT_TENANT_ID;
            const KEYVAULT_CLIENT_ID = process.env.VIDEO_EDITING_KEYVAULT_CLIENT_ID;
            const KEYVAULT_CLIENT_SECRET =  process.env.VIDEO_EDITING_KEYVAULT_CLIENT_SECRET;
            
            // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
            const STORAGE_ACCOUNT_NAME = process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME;
            const STORAGE_ACCOUNT_KEY = process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY;
            const STORAGE_TABLE_NAME = process.env.VIDEO_EDITING_TOKENS_TABLE_NAME;

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
            .then(
                async (data) => {
                    // Create the Key Vault Client
                    const secretCredential = new ClientSecretCredential(KEYVAULT_TENANT_ID, KEYVAULT_CLIENT_ID, KEYVAULT_CLIENT_SECRET);
                    const url = "https://" + KEYVAULT_NAME + ".vault.azure.net";
                    const secretClient = new SecretClient(url, secretCredential);
                    
                    console.log('Attempting to add: ' + JSON.stringify(data));
                    
                    // Create Key Vault secrets for the YouTube Access Token and Refresh Token
                    const uniqueString = newUUID();
                    const tokenSecretName = `youtube-token-${uniqueString}`;
                    const refreshTokenSecretName = `youtube-refresh-token-${uniqueString}`;

                    // Not entirely sure this makes sense as per my 
                    // understanding Key Vault expires on a per day bases 
                    // and the token expires within an hour or so but as a 
                    // practice
                    const tokenExpiry = new Date(Date.now() + data.expires_in);
                    
                    // NOTE: even though we're setting an expiry date on the secrets we're 
                    //       still responsable for deleting the secrets once expired
                    // See: https://stackoverflow.com/a/69583859/3092062
                    var refreshExpiry = null;
                    if(YOUTUBE_APP_VERIFIED) {
                        // Technically, to my knowledge, refresh tokens 
                        // never expiry. However, in order to make sure 
                        // the data store doesn't get over-full with stale 
                        // data setting an arbitrarly large expiry setting 
                        // (a year) as an expiry date for the refresh 
                        // token nmakes sense. Which is similar to what this person is trying to see: 
                        refreshExpiry = new Date((new Date()).setDate((new Date()).getDate() + 365));
                    }
                    else {
                        // While probably a one-time issue because was attempting to use a super old token but thought it 
                        // might be worth paste this here for reference in case it ever comes up again
                        // 
                        // "
                        // Now is your application still in testing on Google cloud console? Have you moved it to published 
                        // has it been though the verification process? If not then your refresh tokens will probably be 
                        // expiring after about two weeks although the time frame may have changed as this seams to be 
                        // something that Google has been working on for the last serval months and there is no official 
                        // word on it.
                        // " (https://stackoverflow.com/a/67633093/3092062)
                        refreshExpiry = new Date((new Date()).setDate((new Date()).getDate() + 14));
                    }

                    // Actually add the secrets to Key Vault
                    const tokenResult = await secretClient.setSecret(tokenSecretName, data.access_token, {expiresOn: tokenExpiry, contentType: 'API Token'});
                    const refreshResult = await secretClient.setSecret(refreshTokenSecretName, data.refresh_token, {expiresOn: refreshExpiry, contentType: 'API Token'});
                    
                    // keeping this for debugging purposes might add a flag eventually
                    //console.log('Token Secret Result: ' + JSON.stringify(tokenResult));
                    //console.log('Refresh Token Result: ' + JSON.stringify(refreshResult));

                    // Create the Azure Table Client
                    const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
                    const tableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, STORAGE_TABLE_NAME, tableCredential);

                    // Create the entry to put in the table
                    // 
                    // NOTE: That the User's Account ID is used as the 
                    //       partitionKey and User's ID as the rowKey (which 
                    //       are the only requireed fields). This is because 
                    //       all entries with the same partitionKey are to 
                    //       be served by the same partition server where 
                    //       rowKey is intended to identifiy a single row (
                    //       or the combination of the parititionKy and 
                    //       rowKey is)
                    //       
                    //       See: https://docs.microsoft.com/en-us/rest/api/storageservices/designing-a-scalable-partitioning-strategy-for-azure-table-storage
                    //       
                    //       It's important to note that there is 
                    //       "namespacing" by way of a: 
                    //       ```{service_name}_{token_type}``` format to 
                    //       field names this is so that if this 
                    //       functionality gets extneded to other services 
                    //       it could, in theory, by straightforward to 
                    //       implement these changes
                    const testEntity = {
                        partitionKey: req.user.aId,
                        rowKey: req.user.id,
                        youtube_token: tokenSecretName,
                        youtube_refresh: refreshTokenSecretName,
                        expires_in: data.expires_in,
                    };
                    
                    //console.log('Entity to be inserted: ' + JSON.stringify(testEntity));
                    
                    // Put the entry in the table
                    const res = await tableClient.upsertEntity(testEntity, 'Replace');
                    
                    // While not strictly neccessary it kind of makes sense 
                    // to me to return the information that in combination 
                    // can find the appropraite row in the Azure Table 
                    // Storage
                    return { account: req.user.aId, user: req.user.id}
                }
            );

            // Technically, this should redirect to back to the page where 
            // the user started authentication from but I haven't quite 
            // gotten that working yet
            res.redirect('/dashboards/video_editing')
        }
    );

export default handler;