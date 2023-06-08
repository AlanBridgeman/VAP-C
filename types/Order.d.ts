import { AccessToServices } from './AccessToServices';
import { OrderProperties } from './OrderProperties';

/**
 * Data structure representing an order placed by a customer for service
 */
export interface Order {
    id?: number,                     // The unique identifier of the order
    accesses?: AccessToServices[],   // The service access(es) associated with this order
    placed: Date,                   // When the order was placed
    paid: Date,                     // When the order was paid
    total: number,                  // The total amount billed/paid
    properties: OrderProperties     // The NoSQL properties of the Order
}