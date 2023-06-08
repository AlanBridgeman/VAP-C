export interface User {
    id: string,                     // A unique identifier to identify the user (UUID)
    email: string,                  // The user's email address
    services: Service[],            // The services the user has access to individually
    aId?: string,                    // The ID of the account
    account: Account,               // The account to which this user belongs
    permissions: UserPermissions[], // The permissions on the account this user has
    properties: UserProperties      // The NoSQL properties of the User
}

export interface UserProperties {
    name?: string | {                        // "<FULL NAME (if not conforms to FIRST NAME, LAST NAME)>",
        fname: string,                       // "<FIRST NAME>",
        lname: string,                       // "<LAST NAME>",
    },
    pronouns?: string | {                    // "<PRONOUNS (if not able to use singular/posessive form)>",
        referral: 'he' | 'her' | 'them',     // "<He/Her/Them/etc...>"
        singular: 'him' | 'her' | 'them',    // "<Him/Her/Them/etc...>",
        posessive: 'his' | 'hers' | 'theirs' // "<His/Hers/Theirs/etc...>",
    },
    avatar?: string,                         // "<IMAGE URL>",
    lang?: {
        '*': string,                         // "<GLOBAL LOCALE TO USE>",
        pages?: {
            [page_name: string]: string      // "<LOCALE THE USER WANTS TO USE FOR A SPECIFIC PAGE>",
        },
        services?: {
            [service_name: string]: string   // "<LOCALE THE USER WANTS TO USE FOR A SPECIFIC SERVICE>",
        }
    }
    stripeId?: string                        // "<STRIPE CUSTOMER ID>"
}

export interface Locale {
    language: 'en' | 'fr',                       // "<LOCALE LANGUAGE>",
    country: 'CA',                        // "<LOCALE COUNTRY>",
    name: string,                           // "<HUMAN READABLE NAME>",
    description?: string,                   // "<LOCALE DESCRIPTION>",
    active: {
        '*': boolean,                       // "<IF LOCALE IS GLOBALLY ACTIVE>",
        pages?: {
            [page_name: string]: boolean    // "<IF LOCALE IS ACTIVE FOR PAGE>",
        },
        services?: {
            [service_name: string]: boolean // "<IF LOCALE IS ACTIVE FOR SERVICE>"
        }
    }
}

export interface Description {
    id?: number,      // A unique identifier to identify this description
    locale: Locale,  // The locale of this description
    type?: 'short' | 'long',    // The type of description this is
    value?: String   // The actual value of the description
}

export interface Name {
    id?: number,
    locale: Locale,
    value: string
}

export interface Account {
    id: string,                         // The unique identifier for the account
    name: String,                       // The name associated with the account
    ogranization?: String,               // The organization name if accounts should be grouped (specifically for Azure Table Storage records)
    permissions: AccountPermission[],   // The permissions configured in the account
    users?: User[],                      // Users in the account
    services?: AccessToServices[],       // The set of services provided at the account level
    properties: AccountProperties       // The NoSQL properties of the Account
}

export interface AccountProperties {
    descriptions?: Description[],         // "<LOCALIZED DESCRIPTION>",
    stripeId?: string                   // "<STRIPE CUSTOMER ID>"
}

export interface AccountPermission {
    id?: number,               // A unique identifier to identify the permission
    name: String,             // The name of the permission (to display for ease of use)
    aId?: String,              // The ID of the account to which this permission is for
    account?: Account,         // The Account object itself to which this permission is for
    users?: UserPermissions[], // The Users that have the permission represented by this row
    rights: RightsDefinition  // The actual rights definition itself
}

export interface RightsDefinition {
    descriptions:Description[],             // "<LOCALIZED DESCRIPTION>",
    permissions:{
        approve?:{                          // "<IF ALLOWED TO APPROVE/CHANGE PERMISSIONS>",
            '*': boolean,
            [service_name: string]: boolean
        },
        change?:{                           // "<IF ALLOWED TO MAKE SETTING CHANGES>",
            '*': boolean,
            [service_name: string]: boolean
        },
        act?:{                              // "<IF ALLOWED TO TRIGGER ACTIONS>"
            '*': boolean,
            [service_name: string]: boolean
        },
        review?:{                           // "<IF ALLOWED TO REVIEW PREVIOUS ACTIVITY ETC...>"
            '*': boolean,
            [service_name: string]: boolean
        }
    }
}

export interface UserPermissions {
    uId?: string,                    // The unique identifier of the user associated with this row
    user?: User,                     // The user associated with this row
    pId?: number,                    // The unique identifier of the permission associated with this row
    permission: AccountPermission,  // The permission associated with this row
    assigned?: Date,                 // When the permission was assigned
    active: Boolean                 // Wheither the permission is currently active
}

export interface Order {
    id: number,                     // The unique identifier of the order
    accesses: AccessToServices[],   // The service access(es) associated with this order
    placed: Date,                   // When the order was placed
    paid: Date,                     // When the order was paid
    total: number,                  // The total amount billed/paid
    properties: OrderProperties     // The NoSQL properties of the Order
}

export interface OrderProperties {
    purchaser: string,
    notes: any,           // "<ANY NOTES USER WANTS TO MAKE>",
    stripeId: string      // "<STRIPE ORDER ID>"
}

export interface AccessToServices {
    uId?        : string,  // The ID of the User that gets access (if applicable to an individual user) |
    user?       : User,    // The User that gets access (if applicable to an individual user) |
    aId?        : string,  // The ID of the Account that gets access (if applicable to an entire account) |
    account?    : Account, // The Account that gets access (if applicable to an entire account)
    sId        : number,   // The ID of the service to which this record gives access to |
    service    : Service,  // The Service to which this record gives access to |
    oId        : number,   // The ID of the order in which this access was gained |
    order      : Order,    // The Order under which access was granted |
    units?      : string,  // The units for quota based             |
    used?       : number,  // The amount used for quota based       |
    max?        : number,  // The maximum amount allowed for quota based |
    activated  : Boolean,  // Whether the service has been activated |
    activeDate? : Date,    // The time/date the service was activated |
    type       : number,   // The type of the service (ex. for Org/Account or for individual user, etc...)
    expiry?    : Date      // The time/date at which point it will expire |
}

export interface ServiceCategory {
    id?: number,
    grouping: string,
    properties: ServiceCategoryProperties
}

export interface ServiceCategoryProperties {
    names: Name[],
    descriptions: Description[]
}

export interface Service {
    id?: number,                    // The unique identifier of the service
    categoryId?: number,             // The ID of the category this belongs to
    category: ServiceCategory,      // The category or this service
    prices: Price[],                // The prices associated with this service
    customers?: AccessToServices[], // The access records (users who have access to the service)
    properties: ServiceProperties   // The NoSQL properties associated with this service
}

export interface ServiceCustomUserProperty {
    name: string,
    from: string
}

export interface ServiceProperties {
    names: Name[],
    descriptions?: Description[],                 // "<LOCALIZED DESCRIPTION>",
    usage?: string,                               // "<SERVICE URL>",
    stripeId: string,                             // "<STRIPE PRODUCT ID>"
    customProperties?: ServiceCustomUserProperty[] // 
}

export interface Price {
    id?: number,                 // A unique ID for this price instance |
    value: number,              // The value this price represents |
    currency: string,           // The currency to bill in (defaults to Canadian/CAD) |
    sId?: number,                // The ID of the service this prices is associated with |
    service?: Service,           // The Service this price is associated with |
    properties: PriceProperties // 
}

export interface PriceProperties {
    name: string,                      // "<PRICE NAME>",
    type: 'one-time' | 'subscription', // "<PRICE TYPE>",
    frequency?: string,                // "<PRICE FREQUUENCY IF APPLICABLE>",
    stripeId: string                   // "<STRIPE PRODUCT ID>"
}