import { SupportedLocales } from './locales';

import { Locale } from '../types/Locale';
import { Description } from '../types/Description'; 
import { Name } from '../types/Name';

function createDescription(value: string, locale: Locale, type?: 'short' | 'long'): Description {
    const description: Description = {
        locale: locale,
        type: type,
        value: value
    }

    return description;
}

export function createDescriptions(english_value: string, french_value: string, types?: {english_type: 'short' | 'long', french_type: 'short' | 'long'}): Description[] {
    const descriptions: Description[] = [
        createDescription(english_value, SupportedLocales.english, types ? types.english_type : undefined),
        createDescription(french_value, SupportedLocales.french, types ? types.french_type : undefined)
    ];

    return descriptions;
}

export function createNames(english_value: string, french_value: string): Name[] {
    const names: Name[] = [
        {
            value: english_value,
            locale: SupportedLocales.english
        },
        {
            value: french_value,
            locale: SupportedLocales.french
        }
    ];
    
    return names;
}