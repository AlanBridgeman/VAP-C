type Language = 'en' | 'fr';

export interface Locale {
    language: Language,                      // "<LOCALE LANGUAGE>",
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