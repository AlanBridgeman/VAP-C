export default async function handler(req, res) {
    // Retrieve the connection from an environment
    // variable called AZURE_STORAGE_CONNECTION_STRING
    const QUEUE_CONNECTION_STRING = process.env.QUEUE_CONNECTION_STRING;
    const QUEUE_NAME = process.env.QUEUE_NAME;
    
    const { QueueClient, QueueServiceClient } = require("@azure/storage-queue");

    // Instantiate a QueueServiceClient which will be used
    // to create a QueueClient and to list all the queues
    const queueServiceClient = QueueServiceClient.fromConnectionString(QUEUE_CONNECTION_STRING);
    
    // Get a QueueClient which will be used
    // to create and manipulate a queue
    const queueClient = queueServiceClient.getQueueClient(QUEUE_NAME);
    
    const triggerMessage = {
        url:decodeURIComponent(req.query.url),
        user:req.query.user
    };

    // Convert to Base64 encoded string to add to the Azure Queue Storage
    const messageText = Buffer.from(JSON.stringify(triggerMessage)).toString('base64');
    
    // Add a message to the queue
    await queueClient.sendMessage(messageText);

    res.status(201).json({ message: "Created" })
}