import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import auth from '../../../middleware/auth';
import { createUser, stringifyUser } from '../../../lib/user';
import ExtendedRequest from '../../../types/ExtendedRequest';
import { User } from '../../../types/User';

/**
 * Handle POST method requests for this route (/api/Requests)
 * 
 * @param req The request object (holds request parameters, etc...)
 * @param res The response object allows responding to requests
 * @returns 
 */
async function handle_post_request(req: ExtendedRequest, res: NextApiResponse) {
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

    const user: User = await createUser(
        userInput.accountName,
        {
            fname: userInput["user-fname"],
            lname: userInput["user-lname"]
        },
        'Mr.',
        {
            posessive: 'his',
            referral: 'he',
            singular: 'him'
        },
        userInput.email,
        userInput.password
    );
    
    // Security-wise, you must hash the password before saving it
    // const hashedPass = await argon2.hash(password);
    // const user = { username, password: hashedPass, name }
    //const createdUser: User = await createUser(user, userInput.password);
    
    // Log the user in (via Passport)
    await req.logIn(user, async (err) => {
        if(err) {
            res.status(500).send('An error occured: ' + err);
        }
        
        // Insert the user into the session
        // I'm not entirely sure it's neccessary to do this, this way 
        // but it's working and seems good enough for now.
        req.session.passport = { user: user.email };
    
        console.log('Checking req.session.passport.user after user creation: ' + req.session.passport.user);
        
        // Save the session
        try {
            await req.session.save();
        }
        catch(e) { console.log(e); }

        stringifyUser(req.user, 'req.user now');
        
        res.status(201).json({
            user: req.user
        });
    });

    //res.status(501).send('Not Implemented Yet.');
}

// Best description is, creates a routing middleware that can then handle further middleware etc...
const handler = nextConnect<ExtendedRequest, NextApiResponse>();

// Setup request handling for this route (/api/Register)
handler
    .use(auth)                  // Use the Auth middleware we've setup
    .post(handle_post_request); // For all POST request to this route use this method

// Export for use by NextJs as the API route
export default handler