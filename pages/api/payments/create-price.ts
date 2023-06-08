import { NextApiRequest, NextApiResponse } from "next";
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const name = req.body.name;
    const product = req.body.product;
    const value = req.body.value;
    const type = req.body.type;
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2020-08-27"
    });

    //
    // The recurring components of a price such as interval and usage_type.
    // recurring {
    //     interval: enum                     // The frequency at which a subscription is 
    //                                        // billed. One of day, week, month or year. 
    //                                        // Possible values: month, year, week, day
    //                                        //
    //     interval_count: positive integer   // The number of intervals (specified in the 
    //                                        // interval attribute) between subscription 
    //                                        // billings. For example, interval=month and 
    //                                        // interval_count=3 bills every 3 months.
    //                                        //
    //     aggregate_usage: string            // Specifies a usage aggregation strategy for 
    //                                        // prices of usage_type=metered. Allowed values 
    //                                        // are sum for summing up all usage during a 
    //                                        // period, last_during_period for using the last 
    //                                        // usage record reported within a period, 
    //                                        // last_ever for using the last usage record ever 
    //                                        // (across period bounds) or max which uses the 
    //                                        // usage record with the maximum reported usage 
    //                                        // during a period. Defaults to sum.
    //     usage_type:enum                    // Configures how the quantity per period should 
    //                                        // be determined. Can be either metered or licensed. 
    //                                        // licensed automatically bills the quantity set when 
    //                                        // adding it to a subscription. metered aggregates the 
    //                                        // total usage based on usage records. Defaults to 
    //                                        // licensed.
    //                                        // Possible values: metered, licensed
    // }
    let recurring;
    
    // Describes how to compute the price per period. 
    // Either per_unit or tiered. per_unit indicates that the fixed amount 
    // (specified in unit_amount or unit_amount_decimal) will be charged 
    // per unit in quantity (for prices with usage_type=licensed), or per 
    // unit of total usage (for prices with usage_type=metered). 
    // tiered indicates that the unit pricing will be computed using a 
    // tiering strategy as defined using the tiers and tiers_mode attributes.
    let billing_scheme;
    let unit_amount;

    // Each element represents a pricing tier. This parameter requires 
    // billing_scheme to be set to tiered. See also the documentation for 
    // billing_scheme.
    // This field is not included by default. To include it in the response, 
    // expand the tiers field.
    // 
    // tiers {
    //     flat_amount: integer                 // Price for the entire tier.
    //     flat_amount_decimal: decimal string  // Same as flat_amount, but 
    //                                          // contains a decimal value 
    //                                          // with at most 12 decimal 
    //                                          // places.
    //     unit_amount: integer                 // Per unit price for units 
    //                                          // relevant to the tier.
    //     unit_amount_decimal: decimal string  // Same as unit_amount, but 
    //                                          // contains a decimal value 
    //                                          // with at most 12 decimal 
    //                                          // places.
    //     up_to: integer                       // Up to and including to 
    //                                          // this quantity will be 
    //                                          // contained in the tier.
    // }
    let tiers;

    // Defines if the tiering price should be `graduated` or `volume` based. 
    // In `volume`-based tiering, the maximum quantity within a period 
    // determines the per unit price. In `graduated` tiering, pricing can 
    // change as the quantity grows.
    let tiers_mode;

    if(type == 'hourly') {
        recurring = {
            usage_type: 'metered'
        };
        billing_scheme = 'per_unit';
        unit_amount = value;          // The unit amount in cents to be charged, represented as a whole integer if possible. Only set if billing_scheme=per_unit.
    }
    else if(type == 'subscription') {
        recurring = {
            interval: 'month'
        }
        billing_scheme = 'tiered';
        tiers = [
            {

                up_to: 36,
                unit_amount: 5000
            },
            {
                up_to: 72,
                unit_amount: 4500
            },
            {
                up_to: 108,
                unit_amount: 4000
            },
            {
                up_to: 144,
                unit_amount: 3500
            },
            {
                up_to: 'inf',
                unit_amount: 3000
            }
        ],
        tiers_mode = 'volume';
    }
    else { // One Time Payment
        recurring = null;
    }

    // 0-36: 90000
    // 36-72: 180000 ((72/2) * 45) + (36 * 5)
    // 72-108: 288000 ((108/2) * 40) + ((36 * 2) * 10)

    const price = await stripe.prices.create({
        product: product.id,            // The ID of the product this price is associated with.
        nickname: name,                 // A brief description of the price, hidden from customers.
        currency: 'cad',                // Three-letter ISO currency code, in lowercase. Must be a supported currency.
        recurring: recurring,           // See above
        billing_scheme: billing_scheme,  // Describes how to compute the price per period. Either per_unit or tiered. per_unit indicates that the fixed amount (specified in unit_amount or unit_amount_decimal) will be charged per unit in quantity (for prices with usage_type=licensed), or per unit of total usage (for prices with usage_type=metered). tiered indicates that the unit pricing will be computed using a tiering strategy as defined using the tiers and tiers_mode attributes.
        tiers: tiers,
        tiers_mode: tiers_mode,
        active: true                    // Whether the price can be used for new purchases.
    });

    res.status(201).json({
        priceId: price.id
    });
}