import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import auth from '../../../middleware/auth';
import Passport from '../../../lib/passport';
import { validatePassword, findUserByEmail } from '../../../lib/db';
import { User } from '../../../types/User';

interface ExtendedRequest extends NextApiRequest {
    user?: any,
    logIn(user, errFunc: (err: any) => void): any
    logOut(): any,
    authenticate(): any
}

const handler = nextConnect<ExtendedRequest, NextApiResponse>()

handler
    .use(auth)  // Use the Auth middleware we've setup
    .post(      // For all POST request to this route use this method
        async (req: ExtendedRequest, res: NextApiResponse) => {
            const creds = { 
                email: req.body.email, 
                password: req.body.password
            }

            if (!creds.email || !creds.password) {
                return res.status(400).send('Missing fields')
            }

            const match: boolean = await validatePassword(creds.email, creds.password);

            if(match) {
                await findUserByEmail(creds.email, async (err, user: User) => {
                    if(err == null && user != null) {
                        // Insert the user into the session
                        // I'm not entirely sure it's neccessary to do this, this way 
                        // but it's working and seems good enough for now.
                        req.session.passport = { user: user };
                        
                        console.log('Set req.session.user to ' + req.session.passport.user);
                        
                        await req.session.save();

                        Passport.authenticate('local');

                        await req.session.save();

                        res.status(200).json({
                            user: req.user
                        });
                    }
                });
            }
        }
    );

// Export for use by NextJs as the API route
export default handler