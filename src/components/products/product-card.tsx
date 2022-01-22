import Link from 'next/link';

import { Button } from 'react-bootstrap';

import styles from '../../styles/grid.module.css';

export default function ProductCard(props) {
    return (
        <div className={styles.card}>
            <h2>{props.icon}{' '}{props.name}</h2>
            <p>{props.desc}</p>
            <br />
            <Link href={props.url}>
                <Button>See More &rarr;</Button>
            </Link>
        </div>
    );
}