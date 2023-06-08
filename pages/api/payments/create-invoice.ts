import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse<Stripe.Invoice>) {
    const customerId = 'cus_L1Q7VyfvmwmBUc';
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });

    const due_date: number = (new Date('2022.02.01').getTime() / 1000)

    const invoice = await stripe.invoices.create({
        customer: customerId,
        description: 'A sample invoice to test this out',
        auto_advance: false, // Explicit action is required
        collection_method: 'send_invoice',
        due_date: due_date
    });
    
    const sendInvoice = await stripe.invoices.sendInvoice(invoice.id);

    res.status(200).json(sendInvoice);
}