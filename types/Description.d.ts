import { Locale } from "./Locale";

type types = 'short' | 'long';

export interface Description {
    id?: number,     // A unique identifier to identify this description
    locale: Locale,  // The locale of this description
    type?: types,    // The type of description this is
    value?: string   // The actual value of the description
}