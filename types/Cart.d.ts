import Stripe from 'stripe';

export interface Cart {
    started?: Date,
    items?: {
        product: Stripe.Product,
        line_item: Stripe.Checkout.SessionCreateParams.LineItem
    }[]
}