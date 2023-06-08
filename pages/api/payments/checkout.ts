import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import Stripe from 'stripe';
import auth from '../../../middleware/auth';
import cookie from '../../../middleware/cookie';
import { Cart } from '../../../types/Cart';
import ExtendedRequest from '../../../types/ExtendedRequest';


const handler = nextConnect<ExtendedRequest, NextApiResponse>()

handler
    .use(auth)      // Use the authentication middleware we've setup
    .use(cookie)    // Use the cookie deserialization middleware we've setup
    .post( // perform this action in response to a POST request
        /**
         * Create a Stripe checkout session for the signed in user with 
         * their current items
         * 
         * @param req 
         * @param res 
         */
        async (req: ExtendedRequest, res: NextApiResponse) => {
            // Variable to hold the items to be checked out with
            let items;

            // If in the request body an items was provided use that
            if(req.body.items) {
                items = req.body.items;
            }

            // Because the `items` variable hasn't been set yet use the 
            // cart cookie and the items contained within to checkout with 
            // (because we're checking out the cart)
            if(!items) {
                const cart: Cart = JSON.parse(req.cookie.cart);
                items = cart.items;
            }

            const line_items = [];
            items.forEach((item, index) => line_items.push(item.line_item));

            console.log('Attempting to checkout with: ' + JSON.stringify(line_items));
            
            // Initialize Stripe
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: "2020-08-27"
            });

            // Create a checkout session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: line_items,
                customer: req.user.stripeId,
                mode: "payment",
                success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: req.body.from //`${req.headers.origin}/cart`
            });

            console.log('Session is: ' + JSON.stringify(session));
            
            // Return the checkout session's ID
            res.status(200).json({ sessionId: session.id })
        }
    );

export default handler;
