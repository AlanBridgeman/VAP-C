/*
 *************************************************************
 * Name: prisma.ts (Prisma Client Aquisition/Creation)
 * Description: Provides the abstraction to get a single 
 *              database connection. However, note that 
 *              because of Azure SQL pricing (https://azure.microsoft.com/en-us/pricing/details/azure-sql-database/single/) 
 *              it is done on a per second of processing basis 
 *              compared to number of concurrent clients (as 
 *              Redis is) so, there is a balence to strike 
 *              here 
 * 
 * See Also: https://www.prisma.io/
 * 
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development 
// to prevent exhausting your database connection limit.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

let prisma: PrismaClient

try {
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
}
else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}
}
catch(e) {
    console.error(e);
}

export default prisma;