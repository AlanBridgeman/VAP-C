import { NextApiRequest, NextApiResponse } from "next";

import { getServicesList } from '../../../lib/services';

import { Service } from '../../../types/Service';

export default async function(req: NextApiRequest, res: NextApiResponse) {
    const services: Service[] = await getServicesList(); 
    //console.log(`Returning services (/api/services/list): ${JSON.stringify({services: services})}`);
    res.status(200).json({services: services});
}