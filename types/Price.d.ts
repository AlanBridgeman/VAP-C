import { Service } from './Service';
import { PriceProperties } from './PriceProperties';

export interface Price {
    id?: number,                 // A unique ID for this price instance |
    value: number,              // The value this price represents |
    currency: string,           // The currency to bill in (defaults to Canadian/CAD) |
    sId?: number,                // The ID of the service this prices is associated with |
    service?: Service,           // The Service this price is associated with |
    properties: PriceProperties // 
}