import Link from 'next/link';

import { Button } from 'react-bootstrap';

import { SupportedLocales } from '../../lib/locales';

import styles from '../../styles/grid.module.css';

function LocalizedButton(props) {
    if(props.locale.language == SupportedLocales.english.language && props.locale.country == SupportedLocales.english.country) {
        return (
            <Link href={props.url}>
                <Button>See More &rarr;</Button>
            </Link>
        );
    }
    else if (props.locale.language == SupportedLocales.french.language && props.locale.country == SupportedLocales.french.country) {
        return (
            <Link href={props.url}>
                <Button>Vu Plus &rarr;</Button>
            </Link>
        );
    }
}

export default function ServiceCard(props) {
    return (
        <div className={styles.card}>
            <h2>{props.icon}{' '}{props.name}</h2>
            <p>{props.desc}</p>
            <br />
            <LocalizedButton url={props.url} locale={props.locale} />
        </div>
    );
}