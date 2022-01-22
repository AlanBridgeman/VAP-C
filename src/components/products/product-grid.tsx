import { useEffect, useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import ProductCard from '../products/product-card';

import styles from '../../styles/Home.module.css';

import { Product } from '../../types/Product';

export default function ProductGrid(props) {
    const [products, setProducts] = useState<Array<Product>>([]);
    
    useEffect(
        () => {
            fetch('/api/products/list')
            .then(res => res.json())
            .then(
                (data) => {
                    console.log(data);
                    setProducts(data.products); 
                }
            );
        }, 
        []
    );

    return (
        <div className={styles.grid}>
            {
                products && products.map(
                    (product, i) => {
                        console.log('The product is' + product);
                        return (
                            <ProductCard
                                key={i}
                                icon={<FontAwesomeIcon icon={product.icon} />}
                                name={product.name} 
                                desc={product.shortDesc} 
                                url={product.url} 
                            />
                        );
                    }
                )
            }
        </div>
    );
}