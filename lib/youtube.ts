// YouTube API video uploader using JavaScript/Node.js
//

import { google, youtube_v3 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';
import { BaseExternalAccountClient, Compute, GoogleAuth, JWT, OAuth2Client, UserRefreshClient } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';
import { BlobDownloadResponseParsed, BlobServiceClient } from '@azure/storage-blob';
import { User } from '../types/User';
import { getServiceTokens } from './azure/key-vault';
import { KeyVaultSecret } from '@azure/keyvault-secrets';
const OAuth2 = google.auth.OAuth2;


// If modifying these scopes, delete your previously saved credentials in client_oauth_token.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];

export async function uploadToYoutube(requester: User, title: string, videoName: string, description: string, tags: string[]): Promise<GaxiosResponse<youtube_v3.Schema$Video> | {redirect: string}> {
    return await authorize(requester, async (auth: OAuth2Client) => { return await uploadVideo(auth, title, videoName, description, tags) });
}

async function getBlobStream(blobName: string): Promise<NodeJS.ReadableStream> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.VIDEO_EDITING_UPLOAD_CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(blobName);
    const downloadResponse: BlobDownloadResponseParsed = await blobClient.download();
    return downloadResponse.readableStreamBody;
}

type authType = string | JWT | UserRefreshClient | BaseExternalAccountClient | GoogleAuth<JSONClient> | OAuth2Client | Compute;

/**
 * Upload the video file.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function uploadVideo(auth: authType, title: string, videoName: string, description: string, tags: string[]): Promise<GaxiosResponse<youtube_v3.Schema$Video>> {
    const service = google.youtube('v3')
    const res = await service.videos.insert({
        auth: auth,
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: title,
                description: description,
                tags: tags,
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            },
            status: {
                privacyStatus: 'private'
            }
        },
        media: {
            body: await getBlobStream(videoName)
        }
    });

    return res;
}

async function useToken(token: string, refresh: string, expiry: number, callback: (auth: OAuth2Client) => Promise<GaxiosResponse<youtube_v3.Schema$Video>>): Promise<GaxiosResponse<youtube_v3.Schema$Video>> {
    const client: OAuth2Client = new OAuth2Client();
    client._clientId = process.env.YOUTUBE_CLIENT_ID;
    client._clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    client.credentials = {
        access_token: token,
        refresh_token: refresh,
        expiry_date: expiry,
    };
    return await callback(client);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(user: User, callback: (auth: OAuth2Client) => Promise<GaxiosResponse<youtube_v3.Schema$Video>>): Promise<GaxiosResponse<youtube_v3.Schema$Video> | {redirect: string}> {
    const tokens: {token: KeyVaultSecret, refresh?: KeyVaultSecret, expiry?: Date} = await getServiceTokens(user, 'youtube');
    
    console.log(JSON.stringify(tokens));

    if(tokens != null) {
        // Because we found a token in storage use it
        return await useToken(tokens.token.value, tokens.refresh.value, tokens.expiry.getTime(), callback);
    }
    else {
        // Because no token was found in storage lets create one
        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        const redirectUrl = process.env.YOUTUBE_REDIRECT_URI
        const oauth2Client: OAuth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
        
        // Save the token so that we don't have to generate it next time
        return {redirect: startAuth(oauth2Client)};
    }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function startAuth(oauth2Client: OAuth2Client) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        include_granted_scopes: true
    });
    return authUrl;
}

function getTokenFromCode(code: string, oauth2Client: OAuth2Client, callback: (auth: OAuth2Client) => void) {
    oauth2Client.getToken(code, function(err: any, token: any) {
        if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
        }
        oauth2Client.credentials = token;
        //storeToken(token);
        callback(oauth2Client);
    });
}