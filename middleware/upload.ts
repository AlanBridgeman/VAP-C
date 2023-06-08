import multer, { Multer } from 'multer';
import { MASNameResolver, MASObjectResolver, MulterAzureStorage } from 'multer-azure-blob-storage';

type MetadataObj = { [k: string]: string };

export default function createUploadMiddleware(blobNameCallback: (req: Express.Request, file: Express.Multer.File) => string, blobMetadataCallback: (req: Express.Request, file: Express.Multer.File) => MetadataObj, blobContentSettingsCallback: (req: Express.Request, file: Express.Multer.File) => MetadataObj): Multer {
    const resolveBlobName: MASNameResolver = (req: Express.Request, file: Express.Multer.File): Promise<string> => {
        return new Promise<string>(
            (resolve, reject) => {
                const blobName: string = blobNameCallback(req, file);
                resolve(blobName);
            }
        );
    };

    const resolveMetadata: MASObjectResolver = (req: Express.Request, file: Express.Multer.File): Promise<MetadataObj> => {
        return new Promise<MetadataObj>((resolve, reject) => {
            const metadata: MetadataObj = blobMetadataCallback(req, file);
            resolve(metadata);
        });
    };

    const resolveContentSettings: MASObjectResolver = (req: Express.Request, file: Express.Multer.File): Promise<MetadataObj> => {
        return new Promise<MetadataObj>((resolve, reject) => {
            const contentSettings: MetadataObj = blobMetadataCallback(req, file);
            resolve(contentSettings);
        });
    };
    
    const azureStorage: MulterAzureStorage = new MulterAzureStorage({
        //connectionString: 'DefaultEndpointsProtocol=https;AccountName=mystorageaccountname;AccountKey=wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY;EndpointSuffix=core.windows.net',
        accessKey: process.env.VIDEO_EDITING_STORAGE_ACCOUNT_KEY,
        accountName: process.env.VIDEO_EDITING_STORAGE_ACCOUNT_NAME,
        containerName: process.env.VIDEO_EDITING_UPLOAD_CONTAINER_NAME,
        blobName: resolveBlobName,
        //metadata: resolveMetadata,
        //contentSettings: resolveContentSettings,
        //containerAccessLevel: 'blob',
        //urlExpirationTime: 60
    });

    const upload: Multer = multer({
        storage: azureStorage
    });

    return upload;
}