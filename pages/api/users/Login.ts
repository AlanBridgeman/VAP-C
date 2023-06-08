import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';

import auth from '../../../middleware/auth';

import Passport from '../../../lib/passport';
import { get_db_adapter } from '../../../lib/db';

import { User } from '../../../types/User';
import ExtendedRequest from '../../../types/ExtendedRequest';

const handler = nextConnect<ExtendedRequest, NextApiResponse>()

handler
    .use(auth)  // Use the Auth middleware we've setup
    .post(      // For all POST request to this route use this method
        /**
         * Log the user in using Passsport using the provided information
         * 
         * @param req 
         * @param res 
         * @returns 
         */
        async (req: ExtendedRequest, res: NextApiResponse, next) => {
            const creds = { 
                email: req.body.email, 
                password: req.body.password
            }

            // Verify the required information was provided.
            if (!creds.email || !creds.password) {
                return res.status(400).send('Missing fields')
            }

            const db_adapter = await get_db_adapter();
            
            // Verify the password provided is the correct password.
            // 
            // NOTE: This does involve a network call as I store NO 
            //       secretive information like passwords client side.
            const match: boolean = await db_adapter.validatePassword(creds.email, creds.password);

            if(match) {
                console.log('Attempting to set req.session.passport.user to ' + creds.email);

                // Set the neeeded session variables (for Passport)
                // Specifically setting the req.session.passport.user to 
                // the appropriate value that the Passport middleware can 
                // deserialize the user from the session. This is critical 
                // to set before calling authenticate and will NOT work 
                // properly if not set
                req.session.passport = { user: creds.email };
                
                // Save the session. Not entirely sure this is neccessary 
                // but seems like a good measure to ensure the session is 
                // setup properly before calling authenticate.
                await req.session.save();

                console.log('Checking that req.session.passport.user is set properly: ' + req.session.passport.user);

                // Authenticate using the Passport middleware
                await Passport.authenticate('local', (err, user, info) => {
                    if(err) {
                        // Send a detailed message to logging
                        console.log('an error occured ' + err);

                        // Send a message to the user to let them know 
                        // what's happened. Be cognizant that we don't know 
                        // what the error is so exposing it to the user 
                        // prematurely may provide inadvertant disclosure 
                        // about the technologies and infrastructure we use 
                        // which if the error was a result of malicious 
                        // intent (which we can't know) it may make them 
                        // aware of attack vectors they weren't previously 
                        // unaware of which would not be a desirable outcome
                        // 
                        // It may also lessen user's confussinn in terms 
                        // of only providing them the level of detail they 
                        // care about
                        res.status(500).send('An error occured while signing in')
                        
                        // We want to return so that we don't continue executing at all
                        return;
                    }

                    console.log('The user seems to have been signed in fine: ' + JSON.stringify(req.user));

                    // Return a 200 (Ok) status code and the user that's 
                    // been logged in
                    res.status(200).json({
                        user: req.user
                    });
                })(req, res, next);
            }
        }
    );

// Export for use by NextJs as the API route
export default handler