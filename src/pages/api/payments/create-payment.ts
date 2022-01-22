import { NextApiRequest, NextApiResponse } from 'next';

import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2020-08-27"
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
    // Create a PaymentIntent with the amount, currency, and a payment method type.
    //
    // See the documentation [0] for the full list of supported parameters.
    //
    // [0] https://stripe.com/docs/api/payment_intents/create
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'CAD',
            amount: 1999,
            automatic_payment_methods: { enabled: true }
        });
        
        // Send publishable key and PaymentIntent details to client
        res.send({
            clientSecret: paymentIntent.client_secret
        });
    }
    catch (e) {
        return res.status(400).send({
            error: {
                message: e.message
            }
        });
    }
}