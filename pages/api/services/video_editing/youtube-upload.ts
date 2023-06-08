import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
import { GaxiosResponse } from 'gaxios';
import { youtube_v3 } from 'googleapis';
import auth from '../../../../middleware/auth';
import ExtendedRequest from '../../../../types/ExtendedRequest';
import createUploadMiddleware from '../../../../middleware/upload';
import { uploadToYoutube } from '../../../../lib/youtube';
import { BlobServiceClient } from '@azure/storage-blob';

const handler = nextConnect<ExtendedRequest, NextApiResponse>({
    onError: (error, req: ExtendedRequest, res: NextApiResponse) => {
        console.log(error);
        res.status(501).json({ error: `Sorry something Happened! ${error.message} ${error}` });
    },
    onNoMatch: (req: ExtendedRequest, res: NextApiResponse) => {
        res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    }
});

function manualRedirectBuild() {
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_AUTH_URI = process.env.YOUTUBE_AUTH_URI;
    const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

    const uriParams = []
    uriParams.push('scope=' + encodeURIComponent('https://www.googleapis.com/auth/youtube.upload'));
    uriParams.push('access_type=offline')
    uriParams.push('prompt=consent')
    uriParams.push('include_granted_scopes=true')
    uriParams.push('state=state')
    uriParams.push('redirect_uri=' + encodeURIComponent(YOUTUBE_REDIRECT_URI))
    uriParams.push('response_type=code')
    uriParams.push('client_id=' + YOUTUBE_CLIENT_ID)
    
    const fullAuthURI = YOUTUBE_AUTH_URI + '?' + uriParams.join('&');

    return fullAuthURI;

}

handler
    .use(auth)
    .post(
        async (req: ExtendedRequest, res: NextApiResponse, next) => {
            console.log(req.body);
            const result: GaxiosResponse<youtube_v3.Schema$Video> | {redirect: string} = await uploadToYoutube(req.user, 'New Video', req.body.name, 'A video uploaded via API', [])

            if(result.hasOwnProperty('redirect')) { // If we need to redirect to get a token
                res.json({redirect: manualRedirectBuild()/*result.redirect*/});
            }
            else {
                const typedResult: GaxiosResponse<youtube_v3.Schema$Video> = result as GaxiosResponse<youtube_v3.Schema$Video>;
                console.log('Result: ' + JSON.stringify(typedResult));
                if(typedResult.status == 200) {
                    // Add the YouTube ID as metadata on the BLOB
                    const VIDEO_ACCOUNT_CONNECTION_STRING = process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING;
                    const blobServiceClient = BlobServiceClient.fromConnectionString(VIDEO_ACCOUNT_CONNECTION_STRING);
                    const containerClient = blobServiceClient.getContainerClient('uploadedvids');
                    const blobClient = containerClient.getBlobClient(req.body.name);
                    await blobClient.setMetadata({youtube_id: typedResult.data.id});

                    res.status(200).json({id: typedResult.data.id});
                }
                // Return the result
                res.json({});
            }
        }
    )

export default handler;