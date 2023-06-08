import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
import { Multer } from 'multer';
import auth from '../../../../middleware/auth';
import ExtendedRequest from '../../../../types/ExtendedRequest';
import createUploadMiddleware from '../../../../middleware/upload';

function getBlobName(req: Express.Request, file: Express.Multer.File) {
    return file.originalname;
}

type MetadataObj = { [k: string]: string };
function getBlobMetadata(req: Express.Request, file: Express.Multer.File): MetadataObj {
    return null;
}

function getBlobContentSettings(req: Express.Request, file: Express.Multer.File): MetadataObj {
    return  {
        contentType: file.mimetype,
        contentDisposition: 'inline'
    };
}

const upload: Multer = createUploadMiddleware(getBlobName, getBlobMetadata, getBlobContentSettings);

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
    .use(upload.any())
    .post(
        async (req: ExtendedRequest, res: NextApiResponse, next) => { 
            const urls: string[] = Array<string>();

            (req.files as Express.Multer.File[]).forEach(
                // NOTE: That files is of any type here this is because to 
                //       use the superset of attributes associated with Azure 
                //       Blob's specifically (see the comment with a table below) 
                //       it would be required to upcast the file objects or ignore 
                //       typing (as is done here)
                (file: any, index: number) => {
                    // The following is a table copied out of the 
                    // documenation as properties available on files
                    // 
                    // | Key          | Description   | Note                |
                    // |--------------|---------------|---------------------|
                    // | fieldname    | The field     | Added by Multer     |
                    // |              | name/key sent |                     |
                    // |              | in the form's |                     |
                    // |              | post request. |                     |
                    // |--------------|---------------|---------------------|
                    // | originalname |	Full original | Added by Mluter     |
                    // |              | name of the   |                     |
                    // |              | file on the   |                     |
                    // |              | user's        |                     |
                    // |              | computer.     |                     |
                    // |--------------|---------------|---------------------|
                    // | encoding     | File encoding | Added by Multer     |
                    // |              | type.         |                     |
                    // |--------------|---------------|---------------------|
                    // | mimetype     | MIME type of  | Added by Multer     | 
                    // |              | the file.     |                     |
                    // |--------------|---------------|---------------------|
                    // | blobName	  | Blob/file     |                     |
                    // |              | name of       |                     |
                    // |              | created blob  |                     |
                    // |              | in Azure      |                     |
                    // |              | Storage       |                     |
                    // |--------------|---------------|---------------------|
                    // | container    | Name of azure |                     |
                    // |              | storage       |                     |
                    // |              | container     |                     |
                    // |              | where the     |                     |
                    // |              | blob/file was |                     |
                    // |              | uploaded to.  |                     |
                    // |--------------|---------------|---------------------|
                    // | blobType     | Type of blob. | From the result     |
                    // |              |               | of call to          |
                    // |              |               | azure's             |
                    // |              |               | getBlobProperties() | 
                    // |              |               | of blobService      |
                    // |--------------|---------------|---------------------|
                    // | size         | Size of the   | From the result of  |
                    // |              | blob.         | call to azure's     |
                    // |              |               | getBlobProperties() |
                    // |              |               | of blobService      |
                    // |--------------|---------------|---------------------|
                    // | etag         | Etag.         | From the result of  |
                    // |              |               | call to azure's     |
                    // |              |               | getBlobProperties() |
                    // |              |               | of blobService      |
                    // |--------------|---------------|---------------------|
                    // | metadata     | Blob's        | From the result of  |
                    // |              | metadata.     | call to azure's     |
                    // |              |               | getBlobProperties() |
                    // |              |               | of blobService      |
                    // |--------------|---------------|---------------------|
                    // | url          | The full url  |                     |
                    // |              | to access the |                     |
                    // |              | uploaded      |                     |
                    // |              | blob/file.	  |                     |
                    // |--------------|---------------|---------------------|
                    urls.push(file.url);
                }
            )

            // Return the resul
            res.json({urls: urls});
        }
    )

export default handler;

export const config = {
    api: {
      bodyParser: false, // Disallow body parsing, consume as stream
    },
};
