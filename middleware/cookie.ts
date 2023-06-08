import { NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
import { parse } from 'cookie';
import ExtendedRequest from '../types/ExtendedRequest';

/**
 * Create a middleware that takes care of a lot of the cookie 
 * deserialization logic
 */
const middleware = nextConnect<ExtendedRequest, NextApiResponse>()

middleware
    .use(
        (req: ExtendedRequest, res: NextApiResponse, next) => {
            req.cookie = parse(req.headers.cookie || '');
            //console.log('Set req.cookie to ' + JSON.stringify(req.cookie));
            return next();
        }
    );

export default middleware;