import { AccessToServices} from '../types/AccessToServices';
import { AccessToServicesType } from '../types/AccessToServicesProperties';
import { Order } from '../types/Order';
import { Service } from '../types/Service';

export function createAccessToServices(order: Order, service: Service, type: AccessToServicesType = 'individual', activated: boolean = true) {
    const accessToService: AccessToServices = {
        order: order,
        activated: activated,
        service: service,
        properties: {
            type: type
        }
    }

    return accessToService;
}