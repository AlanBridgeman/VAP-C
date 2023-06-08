import { NextApiRequest, NextApiResponse } from "next";

import { getServicesList } from '../../../lib/services';

import { Service } from '../../../types/Service';
import { ServiceCategory } from '../../../types/ServiceCategory';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    const categories: ServiceCategory[] = [];
    const services: Service[] = await getServicesList();
    services.forEach(
        service => {
            if(!categories.includes(service.category)) {
                //console.log(`Adding category to array: ${JSON.stringify(service.category)}`);
                categories.push(service.category);
            }
        }
    );

    //console.log('Categories (pages/api/services/list_categories): ' + JSON.stringify(categories));

    res.status(200).json({categories: categories});
}