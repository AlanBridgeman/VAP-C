import { NextApiResponse } from 'next';

import { QueueSendMessageResponse } from '@azure/storage-queue';

import { send_message } from '../../lib/azure/queue-storage';

import { useAuthMiddleware } from '../../middleware/handler';

import ExtendedRequest from '../../types/ExtendedRequest';

/**
 * Trigger the start of cloud processing of a recording this is done via a 
 * Azure Queue Storage queue where a Azure Function is listening to events 
 * on the queue therfore once a message is added the function is triggered 
 * and it performs the appropraite actions.
 * 
 * This way of setting this up is both advantageous and detremental at the 
 * same time because it means the user has very little transparency into the 
 * Azure Function running the processing. However, this is also good 
 * because it is incredibly asyncronous in nature and incredibly scalable.
 * 
 * @param req 
 * @param res 
 */
async function handle(req: ExtendedRequest, res: NextApiResponse<{message: string, response: QueueSendMessageResponse }>) {
    // TO-DO: Implement verification that everything is setup properly for 
    //        the cloud-processing
    
    // Create the trigger message
    const triggerMessage = {
        url: decodeURIComponent(req.query.url.toString()),
        user: req.user
    };

    // Add a message to the queue
    const sendResponse: QueueSendMessageResponse = await send_message('trigger', JSON.stringify(triggerMessage));

    res.status(201).json({ message: "Created", response: sendResponse});
}

export default useAuthMiddleware<{ message: string, response: QueueSendMessageResponse }>(handle, 'GET');