import { IconLookup } from "@fortawesome/fontawesome-svg-core";
import { ProductCategory } from "./ProductCategory";

export interface Product {
    id: string,
    name: string,
    shortDesc?: string,
    url?: string,
    icon?: IconLookup,
    category: ProductCategory
}