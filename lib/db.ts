import DBAdapter from './db/db-adapter';
import PrismaAdapter from "./db/prisma-adapter";
import TediousAdapter from './db/tedious-adapter';

export async function get_db_adapter(): Promise<DBAdapter> {
    let adapter: DBAdapter = null;
    
    // Create the adapter based on the type set in the environment variables
    if(process.env.DB_TYPE == 'Prisma') {
        adapter = await new PrismaAdapter();
    }
    else if(process.env.DB_TYPE == 'Tedious') {
        adapter = await new TediousAdapter();
    }

    // DEBUGGING: Make sure the adapter being returned is the orrect one etc...
    console.log('Returning adapter: ' + adapter);
    
    return adapter;
}