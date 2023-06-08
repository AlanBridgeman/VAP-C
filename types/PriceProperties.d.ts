type PriceType = 'one-time' | 'subscription';

export interface PriceProperties {
    name: string,       // A human readable name for the price
    type: PriceType,    // The type of price this is
    frequency?: string, // Frequency this price would occur (if applicable)
    stripeId: string    // Stripe Price ID
}