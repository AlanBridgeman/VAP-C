import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2020-08-27"
});

/**
 * Get product and price information from Stripe
 * 
 * Note: Because we get all this information directly from our 
 *       database there is no real need to call out to Stripe for 
 *       this method but here to show how we could get 
 *       information from stripe if it does make sense at some 
 *       point in the future 
 */
export async function getDataFromStripe() {
    const productsById = {};

    const productList: Stripe.Product[] = (await stripe.products.list()).data;
    productList.forEach(
        (product: Stripe.Product, index: number) => {
            // Only add products available for purchase
            if(product.active) {
                productsById[product.id] = product;
            }
        }
    );

    const priceList: Stripe.Price[] = (await stripe.prices.list()).data;
    priceList.forEach( // For each price in the list of prices associate with the appropriate product
        (price: Stripe.Price, index: number) => {
            // If the prices array doesn't exist on the product object create it
            if(!productsById[price.product.toString()].prices) {
                productsById[price.product.toString()].prices = [];
            }
            
            // Add this price to the prices array associated with the appropraite product
            productsById[price.product.toString()].prices = productsById[price.product.toString()].prices.push(price);
        }
    );

    return productsById;
}