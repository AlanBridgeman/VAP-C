import { NextApiResponse } from 'next';

import { getBlobById } from '../../lib/azure/blob-storage';

import { useAuthMiddleware } from '../../middleware/handler';
import ExtendedRequest from '../../types/ExtendedRequest';

 /**
  * API route to get BLOB metadat/information
  * 
  * @param {ExtendedRequest} req The request to the route
  * @param {NextApiResponse} res The response for the route
  */
async function handle(req: ExtendedRequest, res: NextApiResponse<{url: string}>) {
    // Get the BLOB name from the URL
    const blob_name = req.query.name.toString();
    
    // Get the BLOB information from Azure
    const url: string | null = await getBlobById(req.user, blob_name);
    
    if(url !== null) {
        // Return the url of the blob (recording)
        res.status(200).json({ url: url });
    }
    else {
        // Return a 404 Not Found error
        res.status(404).json({ url: '' })
    }
}

export default useAuthMiddleware<{ url: string }>(handle, 'GET');