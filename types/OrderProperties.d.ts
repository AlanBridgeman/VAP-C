/**
 * The Order NoSQL properties/record
 */
export interface OrderProperties {
    purchaser: string,    // Who placed/purchased the order
    notes?: any,          // Any notes the user (or someone on the account with access) wants to make about the order
    stripeId: string      // Stripe Order ID
}