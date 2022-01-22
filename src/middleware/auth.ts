import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect'
import { ironSession } from 'iron-session/express';
import passport from '../lib/passport'
import { sessionOptions } from '../lib/session'
import { parse } from 'cookie';

/**
 * Create a middleware that takes care of a lot of the authentication 
 * complexities such as session management
 */
const auth = nextConnect<NextApiRequest, NextApiResponse>()
    .use(ironSession(sessionOptions)) // Initialize encrypted session
    .use(passport.initialize())       // Initialize Passport
    .use(passport.session())          // Serialize user into the session
  
export default auth;
