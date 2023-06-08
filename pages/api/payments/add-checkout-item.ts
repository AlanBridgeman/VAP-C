import { NextApiResponse } from "next";
import nextConnect from 'next-connect';
import Stripe from 'stripe';
import { serialize } from 'cookie';

import cookie from '../../../middleware/cookie';

import ExtendedRequest from "../../../types/ExtendedRequest";
import { Cart } from "../../../types/Cart";

const handler = nextConnect<ExtendedRequest, NextApiResponse<{item: {product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem}}>>();
handler
    .use(cookie)
    .post(
        async (req: ExtendedRequest, res: NextApiResponse<{item: {product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem}}>) => {
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
                //name: product.name,
                description: product.description,
                //adjustable_quantity: adjustable,
                quantity: quantity,
                price: priceId
            };
            
            let items: {product: Stripe.Product, line_item: Stripe.Checkout.SessionCreateParams.LineItem}[] = [];
            let products: Stripe.Product[] = [];
            if(req.cookie.cart !== undefined) {
                const oldCart: Cart = JSON.parse(req.cookie.cart);
                items = oldCart.items;
            }
            items.push({
                product: product,
                line_item: checkoutItem
            });

            const cart: Cart = {
                items: items
            }

            console.log('Setting cart cookie to: ' + JSON.stringify(cart));

            const cookie = serialize('cart', JSON.stringify(cart), {
                path: '/',
                maxAge: 3000,
                sameSite: true
            });
            
            res.setHeader('set-cookie', cookie);
            res.status(200).json({item: {product: product, line_item: checkoutItem}});
        }
    );

export default handler;