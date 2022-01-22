import type { IronSessionOptions } from 'iron-session';
import type { User } from '../types/User';

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
  interface IronSessionData {
    user?: User,
    passport?: {
      user: User
    } 
  }
}