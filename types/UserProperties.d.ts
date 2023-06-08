type StandardName = {
    fname: string,  // First Name
    lname: string   // Last Name
}
export type Name = string | StandardName;
export type Salutation = 'Mr.' | 'Ms.' | 'Mrs.' | string;
type ReferralPronoun = 'he' | 'she' | 'them';
type SingularPronoun = 'him' | 'her' | 'them';
type PosessivePronoun = 'his' | 'hers' | 'theirs';
type PreDefinedPronouns = {
    referral: ReferralPronoun,    // The referral pronoun to use (he/she/them)
    singular: SingularPronoun,    // The singular pronoun to use (him/her/them)
    posessive: PosessivePronoun   // The posessive pronoun to use (his/hers/theirs)
}
export type Pronouns = string | PreDefinedPronouns;

export interface UserProperties {
    name?: Name,
    salutation?: Salutation,
    // NOTE: This can be a string or one of the existing values. 
    //       This is because ideally their choosen version will 
    //       be in the set of defined ones (as it's easier to 
    //       understand/contextualize what to user where). 
    //       However, if people have a completely different value 
    //       they want to use they would be able to do so
    pronouns?: Pronouns,
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