export interface ProductCategory {
    id: string,                     // A UUID string identifying the product category
    name: string,                   // The name of the product category
    products: Array<string>         // A list of product IDs of thep roducts in this category
}