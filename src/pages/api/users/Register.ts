import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import auth from '../../../middleware/auth';
import Passport from '../../../lib/passport';
import { findAccountByName, createUser } from '../../../lib/db';
import ExtendedRequest from '../../../types/ExtendedRequest';

const handler = nextConnect<ExtendedRequest, NextApiResponse>()

handler
    .use(auth)  // Use the Auth middleware we've setup
    .post(      // For all POST request to this route use this method
        async (req: ExtendedRequest, res: NextApiResponse) => {
            const user = {
                email: req.body['user-email'],
                password: req.body['user-password'],
                accountName: req.body['account-name'],
                "user-fname": req.body['user-fname'],
                "user-lname": req.body['user-lname']
            }

            if (!user.email || !user.password) {
                return res.status(400).send('Missing fields')
            }

            const account = await findAccountByName(user.accountName);
            
            // TO-DO: Manually check integrity constraints here so that error is returned to user faster and more descriptively 
            // Here you check if the username has already been used
            /*const accountNameExisted = !!account
            if (accountNameExisted) {
                return res.status(409).send(account + 'The username has already been used')
            }*/
            
            // Security-wise, you must hash the password before saving it
            // const hashedPass = await argon2.hash(password);
            // const user = { username, password: hashedPass, name }
            await createUser(req, user)

            //console.log('Is req.session.passport.user set properly?: ' + (req.session as ExtendedSession).passport.user)

            Passport.authenticate('local')

            /*req.logIn(user, (err) => {                
                if (err)
                    throw err
                
                console.log('From inside the req.logIn function')

                // Log the signed up user in
                res.status(201).json({
                    user
                })
            })*/

            await req.session.save();

            res.status(201).json({
                user
            });
        }
    );

// Export for use by NextJs as the API route
export default handler