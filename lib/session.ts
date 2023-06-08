/*
 *************************************************************
 * Name: session.ts (IronSession's/Encrypted Stateless 
 *                   Session's Configuration)
 * Description: This file is inteded to provide an 
 *              abstraction for the encrypted stateless 
 *              session's option details. Specifically, this 
 *              is things like the expiry, returned data 
 *              typing, encryption-key, etc...
 *
 * See Also: https://github.com/vvo/iron-session
 * 
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import type { IronSessionOptions } from 'iron-session';
import type { User } from '../types/User';

/**
 * Provide a standardized set of options to provide when creating an 
 * managing the session.
 */
export const sessionOptions: IronSessionOptions = {
    password: process.env.SESSION_TOKEN_SECRET as string,
    cookieName: 'alanbridgeman.ca/iron-session',
    // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
}

// This is where we specify the typings of req.session.*
declare module 'iron-session' {
    export interface IronSessionData {
        user?: User,
        passport?: {
            user: string
        } 
    }
}