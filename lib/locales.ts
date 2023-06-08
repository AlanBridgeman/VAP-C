import { Locale } from '../types/Locale';

type LocaleMap = {[locale_name: string]: Locale}

function getSupportedLocales(): LocaleMap {
    const can_english: Locale = {
        language: 'en',
        country: 'CA',
        name: 'Canadian English',
        description: 'English spoken in Canada',
        active: {
            "*": true
        }
    }
    
    const can_french: Locale = {
        language: 'fr',
        country: 'CA',
        name: 'français au Canadian',
        description: 'français parlé au Canada',
        active: {
            "*": true
        }
    }
    
    return {english: can_english, french: can_french};
}


export const SupportedLocales = getSupportedLocales();