import { NextApiResponse } from "next";
import nextConnect from 'next-connect';
import Stripe from 'stripe';
import { serialize } from 'cookie';

import cookie from '../../../middleware/cookie';

import ExtendedRequest from "../../../types/ExtendedRequest";
import { Cart } from "../../../types/Cart";

const handler = nextConnect<ExtendedRequest, NextApiResponse<{product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem}>>();
handler
    .use(cookie)
    .post(
        async (req: ExtendedRequest, res: NextApiResponse<{product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem}>) => {
            const productId = req.body.product;
            const quantity = req.body.quantity;
            const priceId = req.body.price;
            
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: "2020-08-27"
            });
            
            const product = await stripe.products.retrieve(productId);
            
            /*const adjustable: Stripe.Checkout.SessionCreateParams.LineItem.AdjustableQuantity = {
                enabled: true,
                minimum: 1,
                maximum: 10
            }*/

            const checkoutItem: Stripe.Checkout.SessionCreateParams.LineItem = {
                description: product.description,
                //adjustable_quantity: adjustable,
                quantity: quantity,
                price: priceId
            };
            
            const item: {product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem} = {
                product: product,
                line_item: checkoutItem
            };
            
            res.status(200).json(item);
        }
    );

export default handler;

/*
 {
     "items":[
         {
             "product":{
                 "id":"prod_KxLgos3Yl1IlTi",
                 "object":"product",
                 "active":true,
                 "attributes":[],
                 "created":1642071436,
                 "description":"Provide technical support before, during and after an event which may include answering technical questions, performing technical admin tasks (ex. ensuring proper permissions, technical functionality) communications (particularly technical details)",
                 "images":[],
                 "livemode":false,
                 "metadata":{},
                 "name":"Event Support",
                 "package_dimensions":null,
                 "shippable":null,
                 "statement_descriptor":null,
                 "tax_code":"txcd_20030000",
                 "type":"service",
                 "unit_label":"event hour",
                 "updated":1642071436,
                 "url":null
            },
            "line_item":{
                "description":"Provide technical support before, during and after an event which may include answering technical questions, performing technical admin tasks (ex. ensuring proper permissions, technical functionality) communications (particularly technical details)",
                "quantity":1,
                "price":"price_1KHR8WI0ZxFgQb9j6Pot9dMp"
            }
        }
    ]
}
 */