import { NextApiRequest } from 'next';
import User from './User';
import Cart from './Cart';

export default interface ExtendedRequest extends NextApiRequest, Express.Request {
    user?: User,
    cookie?: {
        cart?: string,
        [x: string]: string
    },
    logIn(user, errFunc: (err: any) => void): any
    logOut(): any,
    authenticate(): any
}