/*
 *************************************************************
 * Name: queue-storage.ts (Azure Queue Storage Access)
 * Description: This file is intended to provide centralized 
 *              functionality for accessing Azure Queue 
 *              Storage so that the specifics around how to 
 *              connect to Azure Storage Account, 
 *              specifically Queue Storage (particularly 
 *              credentials etc...) are abstracted away from 
 *              other business logic and front-end code
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import { QueueClient, QueueSendMessageResponse, QueueServiceClient } from '@azure/storage-queue';

const TRIGGER_QUEUE = typeof process.env.VIDEO_EDITING_TRIGGER_QUEUE_NAME !== 'undefined' ? process.env.VIDEO_EDITING_TRIGGER_QUEUE_NAME : '';
const OPS_QUEUE = typeof process.env.VIDEO_EDITING_OPERATIONS_QUEUE_NAME !== 'undefined' ? process.env.VIDEO_EDITING_OPERATIONS_QUEUE_NAME : '';
const DEFAULT_QUEUE_CONNECTION_STRING = typeof process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING !== 'undefined' ? process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING : '';

export async function send_message(queueName: string, message: string, storage_connection_string: string = DEFAULT_QUEUE_CONNECTION_STRING): Promise<QueueSendMessageResponse> {
    // Instantiate a QueueServiceClient which will be used
    // to create a QueueClient and submit a trigger message
    const queueServiceClient: QueueServiceClient = QueueServiceClient.fromConnectionString(storage_connection_string);
    
    // Get a QueueClient which will be used
    // to create and manipulate a queue
    let queueClient: QueueClient;
    if(queueName === 'trigger') {
        queueClient = queueServiceClient.getQueueClient(TRIGGER_QUEUE);
    }
    else if(queueName === 'operations') {
        queueClient = queueServiceClient.getQueueClient(OPS_QUEUE);
    }

    // Convert to Base64 encoded string to add to the Azure Queue Storage
    const messageText = Buffer.from(message).toString('base64');
    
    // Add a message to the queue
    const sendResponse: QueueSendMessageResponse = await queueClient.sendMessage(messageText);

    // Return the send message response
    return sendResponse;
}