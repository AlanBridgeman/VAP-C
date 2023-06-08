import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
import auth from '../../middleware/auth';
//import { deleteUser, createUser, updateUserByEmail } from '../../lib/db';
import Passport from '../../lib/passport';
import { createUser, stringifyUser } from '../../lib/user';
import { GET, PUT, useAuthMiddleware } from '../../middleware/handler';

import ExtendedRequest from '../../types/ExtendedRequest';
import { User } from '../../types/User';
import { Pronouns } from '../../types/UserProperties';

/**
 * Callback for the PUT method that creates a User
 * 
 * Note, this doesn't sign in the user at all that nedes to be done seperately
 * 
 * @param req 
 * @param res 
 */
async function createUserCallback(req: ExtendedRequest, res: NextApiResponse) {
    // Put provided request values (request parameters) into a 
    // more easily accessible format
    const userInput = {
        email: req.body['user-email'],
        password: req.body['user-password'],
        accountName: req.body['account-name'],
        "user-fname": req.body['user-fname'],
        "user-lname": req.body['user-lname']
    }

    // Verify required fields wre provided
    if (!userInput.email || !userInput.password) {
        return res.status(400).send('Missing fields')
    }

    const userNames = {
        fname: userInput["user-fname"],
        lname: userInput["user-lname"]
    };
    const userPronouns: Pronouns = {
        posessive: 'his',
        referral: 'he',
        singular: 'him'
    };
    const user: User = await createUser(userInput.accountName, userNames, 'Mr.', userPronouns, userInput.email, userInput.password);
    
    res.status(201).json({});
}

/**
 * Callback for the POST method that saves/updates the user
 * 
 * @param req 
 * @param res 
 */
function updateUser(req: ExtendedRequest, res: NextApiResponse<{ user: User | null, error?: string }>) {
    if(typeof req.user !== 'undefined') {
        res.status(200).json({ user: req.user });
    }
    else {
        res.status(401).json({ user: null, error: 'Unauthorized' });
    }
}

/**
 * Callback for the GET method that loads the user
 * 
 * @param req 
 * @param res 
 * @param next 
 */
async function getUser(req: ExtendedRequest, res: NextApiResponse<{ user: User | null, error?: string }>, next?: NextApiHandler) {
    console.log('Session Data: ' + JSON.stringify(req.session));
    
    await Passport.authenticate(
        'local', 
        async function(err, user, info) {
            if(err) {
                res.status(500).json({user: null, error: 'An error occured: ' + err});
            }
            
            res.status(200).json({user: req.user});
        }
    )(req, res, next);
}

// Chain the handlers together adding the auth middleware for GET and POST
const create_handler = PUT(createUserCallback);
const update_handler = useAuthMiddleware<{ user: User }>(updateUser, 'POST', [], create_handler);
const get_handler = GET<{ user: User, error?: string }>(getUser, [], update_handler);

// Return the combination handler
export default get_handler;