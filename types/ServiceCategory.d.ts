import { ServiceCategoryProperties } from './ServiceCategoryProperties';

export interface ServiceCategory {
    id?: number,
    grouping: string,
    properties: ServiceCategoryProperties
}