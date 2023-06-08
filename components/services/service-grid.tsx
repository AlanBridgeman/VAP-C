import { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useServices } from '../../lib/hooks';

import ServiceCard from './service-card';

import styles from '../../styles/Home.module.css';

import { Service } from '../../types/Service';
import { Locale } from '../../types/Locale';

interface Props {
    locale: Locale
}

export default function ServiceGrid(props: Props) {
    const [services, { loading }]: [Service[], { loading: boolean }] = useServices();

    return (
        <div className={styles.grid}>
            {
                services && services.map(
                    (service, i) => {
                        console.log('The service is' + service);

                        return (
                            <ServiceCard
                                key={i}
                                icon={<FontAwesomeIcon icon={service.properties.icon} />}
                                name={service.properties.names.map(
                                    (name, index) => {
                                        if(props.locale.language == name.locale.language && props.locale.country == name.locale.country) {
                                            return name.value;
                                        }
                                    }
                                )} 
                                desc={
                                    service.properties.descriptions.map(
                                        (desc, index) => {
                                            const isShortDesc = desc.type && desc.type == 'short';
                                            const matchLocale = props.locale.language == desc.locale.language && props.locale.country == desc.locale.country;
                                            if(isShortDesc && matchLocale) {
                                                return desc.value;
                                            }
                                        }
                                    )
                                } 
                                url={service.properties.usage}
                                locale={props.locale}
                            />
                        );
                    }
                )
            }
        </div>
    );
}