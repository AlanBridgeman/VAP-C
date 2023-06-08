import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const name = req.body.name;

    if(name == '') {
        res.status(400).json({ message: "Can't have empty name product" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });

    const product = await stripe.products.create({
        name: name,
        active: true,
        shippable: false,
        statement_descriptor: 'Trial Product',
        unit_label: 'hour',
        url: 'https://alanbridgeman.ca/'
    });

    res.status(201).json({ productId: product.id })
}