import { User } from './User';
import { Account } from './Account';
import { Service } from './Service';
import { Order } from './Order';
import { AccessToServicesProperties} from './AccessToServicesProperties';

/**
 * The association between a user/account and the services they have access to (and the order that was placed to get 
 * access to that service)
 */
export interface AccessToServices {
    // IMPORTANT: Note, we only retain the ID of the purchasing agen (User 
    //            or Account) not the objects themselves this is so that we 
    //            can easily obtain this information while avoiding circular 
    //            dependencies
    uId?: string,                           // The ID of the User that gets access (if applicable to an individual user)
    aId?: string,                           // The ID of the Account that gets access (if applicable to an entire account)
    
    sId?: number,                           // The ID of the service to which this record gives access to
    service: Service,                       // The Service to which this record gives access to
    oId?: number,                           // The ID of the order in which this access was gained
    order: Order,                           // The Order under which access was granted
    activated: boolean,                     // Whether the service has been activated
    activeDate?: Date,                      // The time/date the service was activated
    expiry?: Date                           // The time/date at which point it will expire
    properties: AccessToServicesProperties  // The NoSQL properties of the AccessToServices record
}