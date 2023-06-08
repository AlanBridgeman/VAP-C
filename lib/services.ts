import { get_db_adapter } from './db';
import { Service } from '../types/Service';

export async function getServicesList() {
    // Check if the account already exists
    let services: Service[] = await (await get_db_adapter()).listServices();
    //console.log(`Returning Services (/lib/services/getServicesList): ${JSON.stringify(services)}`);
    return services;
}