import { Description } from './Description';

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