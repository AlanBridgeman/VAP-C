import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';

/**
 * Creates a customer within Stripe
 * 
 * @see 
 * 
 * @param req
 * @param res
 * @return
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify data provide is in a proper format
    if(req.headers["content-type"] != 'application/json') {
        res.status(400).send('Unknown Content-Type specified');
    }

    const { name, email, description } = req.body;
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });
    
    // Create a stripe customer
    const customer = await stripe.customers.create({
        name: name,
        email: email,
        description: description,
    });

    res.status(200).json({ 
        cid: customer.id 
    });
}