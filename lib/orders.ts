import { Order } from '../types/Order';
import { OrderProperties } from '../types/OrderProperties';

export function createOrder(paid: Date, placed: Date, total: number, purchaser: string, stripeId: string) {
    return createOrderObj(placed, total, paid, createOrderProperties(purchaser, stripeId));
}

function createOrderProperties(purchaser: string, stripeId: string) {
    const orderProperties: OrderProperties = {
        purchaser: purchaser,
        stripeId: stripeId
    };

    return orderProperties;
}

function createOrderObj(placed: Date, total: number, paid: Date, properties: OrderProperties) {
    const order: Order = {
        paid: paid,
        placed: placed,
        total: total,
        properties: properties
    };

    return order;
}