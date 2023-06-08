import { Name } from './Name';
import { Description } from './Description';

export interface ServiceCategoryProperties {
    names?: Name[],
    descriptions?: Description[]
}