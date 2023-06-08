import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import { get_db_adapter } from '../../../lib/db';

import auth from '../../../middleware/auth';

import ExtendedRequest from '../../../types/ExtendedRequest';

const handler = nextConnect<ExtendedRequest, NextApiResponse>();

handler
    .use(auth)
    .post(
        async (req: ExtendedRequest, res: NextApiResponse) => {
            await (await get_db_adapter()).updateUserByEmail(req.user.email, {stripeId: req.body.stripeId});
            res.status(200).json({stripeId: req.body.stripeId});
        }
    )

export default handler;