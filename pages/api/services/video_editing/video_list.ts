import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
//import azure_storage from 'azure-storage';
import auth from '../../../../middleware/auth';
import ExtendedRequest from '../../../../types/ExtendedRequest';
import { BlobItem, BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

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
    .use(auth)
    .get(
        async (req: ExtendedRequest, res: NextApiResponse, next) => { 
            const blobs: BlobItem[] = Array<BlobItem>();

            //const blobService = new azure_storage.BlobService(process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY, process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME);
            //const blobServiceClient = new BlobServiceClient(process.env.VIDEO_EDITING_STORAGE_ACCOUNT_URL, (new StorageSharedKeyCredential(process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME, process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY)));
            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(process.env.VIDEO_EDITING_UPLOAD_CONTAINER_NAME);
            const blobList = containerClient.listBlobsFlat();
            var curr_blob: IteratorResult<any, BlobItem> = await blobList.next();
            while(!curr_blob.done) {
                const blob: BlobItem = curr_blob.value;
                blobs.push(blob);

                curr_blob = await blobList.next();
            }
            // Return the result
            res.json({blobs: blobs});
        }
    )

export default handler;

export const config = {
    api: {
      bodyParser: false, // Disallow body parsing, consume as stream
    },
};
