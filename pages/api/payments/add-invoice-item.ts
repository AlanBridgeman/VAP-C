import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse<Stripe.InvoiceItem>) {
    const customerId = 'cus_L1Q7VyfvmwmBUc';
    const priceId = 'price_1KHR8WI0ZxFgQb9j6Pot9dMp';
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });

    const invoiceItem = await stripe.invoiceItems.create({
        customer: customerId,
        price: priceId
    });

    

    res.status(200).json(invoiceItem);
}