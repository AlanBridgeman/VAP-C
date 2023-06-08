import { ServiceCategory } from './ServiceCategory';
import { Price } from './Price';
import { AccessToServices } from './AccessToServices';
import { ServiceProperties } from './ServiceProperties';

export interface Service {
    id?: number,                    // The unique identifier of the service
    categoryId?: number,            // The ID of the category this belongs to
    category: ServiceCategory,      // The category or this service
    prices: Price[],                // The prices associated with this service
    customers?: AccessToServices[], // The access records (users who have access to the service)
    properties: ServiceProperties   // The NoSQL properties associated with this service
}