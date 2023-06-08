import { BlobServiceClient, ContainerClient, BlockBlobClient } from "@azure/storage-blob";
import { User } from "../../types/User";

const VIDEO_ACCOUNT_NAME: string = typeof process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME !== 'undefined' ? process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME : '';
const VIDEO_ACCOUNT_CONNECTION_STRING: string = typeof process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING !== 'undefined' ? process.env.VIDEO_EDITING_STORAGE_CONNECTION_STRING : '';

export async function getBlobByURL(container_name: string): Promise<{[blob_name: string]: string}> {
    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient: BlobServiceClient = BlobServiceClient.fromConnectionString(VIDEO_ACCOUNT_CONNECTION_STRING);
    const containerName = container_name;

    // Get a reference to a container
    const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);

    const urls: {[blob_name: string]: string} = {};

    // List the blob(s) in the container.
    for await (const blob of containerClient.listBlobsFlat()) {
        const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blob.name);
        urls[blockBlobClient.name] = blockBlobClient.url;
    }

    return urls;
}

/**
 * Get the URL of a particular recording based on the user and recording's name
 * 
 * @param {User} user The user requesting (used to "calculate" the storage container's name)
 * @param {string} blob_name The name of the recording
 * @returns {Promise<string | null>} A string if the recording is found. Nul otherwise
 */
export async function getBlobById(user: User, blob_name: string): Promise<string | null> {
    // Create the BlobServiceClient object which will be used to create a container client
    const blobServiceClient: BlobServiceClient = BlobServiceClient.fromConnectionString(VIDEO_ACCOUNT_CONNECTION_STRING);
    
    // Because recordings are stored on a per account basis take the user,
    // find the account and use it in the container name
    const containerName = user.aId + '-recordings';

    // Get a reference to a container
    const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);

    // List the blob(s) in the container.
    for await (const blob of containerClient.listBlobsFlat()) {
        const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blob.name);
        if(blockBlobClient.name == blob_name) {
            return blockBlobClient.url;
        }
    }

    return null;
}