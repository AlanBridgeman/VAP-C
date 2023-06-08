import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

/**
 * Create a usage record for Stripe to bill properly
 * 
 * @see https://stripe.com/docs/api/usage_records/create
 * 
 * @param req 
 * @param res 
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const subscriptionId = req.body.subscription;
    const amount = req.body.amount;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });

    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionId,
        {
            quantity: amount,
            timestamp: Date.now()
        }
    );

    res.status(201).json(usageRecord);
}