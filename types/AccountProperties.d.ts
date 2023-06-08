import { Description } from './Description';

/**
 * Account NoSQL properties/record
 */
export interface AccountProperties {
    descriptions?: Description[],  // localized description
    stripeId?: string              // Stripe customer ID (if applicable)
}