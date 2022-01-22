import { NextApiRequest, NextApiResponse } from "next";

import { v4 as newUUID } from 'uuid';

import { IconLookup } from '@fortawesome/fontawesome-common-types';

import { Product } from '../../../types/Product';
import { ProductCategory } from '../../../types/ProductCategory';

function createNewProduct(name: string, description: string, icon: IconLookup, category: ProductCategory): Product {
    const product: Product = {
        id: newUUID(),          // Create a randomized UUID as the product ID
        name: name,             // Product name supplied by user
        shortDesc: description, // Product description supplied by user
        icon: icon,             // Product icon supplied by user
        category: category      // Product Category supplied by user
    };

    // Set the URL using the product name assume that all spaces are replaced with an _
    product.url = '/products/' + product.category.name.replace(/\s+/g, '-') + '/' + product.name.replace(/\s+/g, "_");
    
    // Add the product to the ccategory's array of products (uses id to avoid infinite loop)
    product.category.products.push(product.id);
    
    return product;
}

function getProducts(): object {
    const productCategory: Array<ProductCategory> = [
        {
            id: newUUID(),
            name: "Tech Services",
            products:[]
        },
        {
            id: newUUID(),
            name: "Accessibility Services",
            products:[]
        }
    ];
    
    const products: Array<Product> = [
        createNewProduct(
            'Event Support', 
            'Provide basic event support', 
            {
                prefix: 'fad',
                iconName: 'users-class'
            }, 
            productCategory[0]
        ),
        createNewProduct(
            'Video Editing', 
            'Simple Video editing', 
            { 
                prefix: 'fad', 
                iconName: 'video' 
            }, 
            productCategory[0]
        ),
        createNewProduct(
            'Consulting', 
            'Help people be inclusive with their digital matterials', 
            { 
                prefix: 'fad', 
                iconName: 'user-group' 
            }, 
            productCategory[1]
        )
    ]
  
    return { products: products} ;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json(getProducts());
}