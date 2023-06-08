

import { Name } from './Name';
import { Description } from './Description';
import { ServiceCustomUserProperty } from './ServiceCustomUserProperty';

export interface ServiceProperties {
    names?: Name[],                                  // Localized Name(s)
    descriptions?: Description[],                   // Localized Description(s)
    usage?: string,                                 // The URL at which to access the service
    icon?: IconLookup,                              // The icon associated with the service
    stripeId: string,                               // Stripe Product ID
    customProperties?: ServiceCustomUserProperty[]  // Defines a set of properties to add to the user that are specific for this service
}