export type AccessToServicesType = 'individual'|'organization';

export interface AccessToServicesProperties {
    units?: string,             // The units for quota based
    used?: number,              // The amount used for quota based
    max?: number,               // The maximum amount allowed for quota based
    type: AccessToServicesType, // The type of the access to the service (ex. for Org/Account or for individual user, etc...)
}