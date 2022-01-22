import { NextApiRequest } from 'next';

export default interface ExtendedRequest extends NextApiRequest {
    user?: any,
    logIn(user, errFunc: (err: any) => void): any
    logOut(): any,
    authenticate(): any
}