/*
 *************************************************************
 * Name: passport.ts (Passport Implementation)
 * Description: Provides the Passport implemenation including 
 *              the verification for the Local strategy, 
 *              serialization and deserialization of the user 
 *              into and out of the session (as well as Redis 
 *              cache use/implmentation as it relates to 
 *              retrieving user specific data quickly and 
 *              efficiently without having to constantly go 
 *              back to the database)
 *
 * See Also: https://www.passportjs.org/
 * 
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import passport from 'passport'
import * as Local from 'passport-local';
//import redisClient, { startRedisConnection } from './redis';
import { get_db_adapter } from './db';
import { getServiceTokens } from './azure/key-vault';
import { User as UserModel } from '../types/User';
import { stringifyUser } from './user';
import DBAdapter from './db/db-adapter';
import { ServiceCustomUserProperty } from '../types/ServiceCustomUserProperty';
import { AccessToServices } from '../types/AccessToServices';
import { KeyVaultSecret } from '@azure/keyvault-secrets';

/**
 * Override the Express.User to be my User model definition.
 * This is because of the typescript definition of Passport. 
 */
namespace Express {
    export interface User extends UserModel { }
}

/**
 * Serialize the user into the session
 * Part of setup for passport.initialize() and passport.session()
 */
passport.serializeUser(
    async (user: Express.User, done) => {
        stringifyUser(user, 'Serializing User');

        // serialize the username into session
        done(null, user.email);
    }
);

async function addServiceTokensToUser(user: Express.User) {
    // Get a list of the (external) services of which we need to get tokens for
    const user_service_token_names: string[][] = user.services.map( // Go over each (internal) service to find the tokens they want
        (service: AccessToServices, index: number): string[] => {
            return service.service.properties.customProperties.map( // Go over each custom property (for each service) to find the names of (external) service tokens it wants
                (customProperty: ServiceCustomUserProperty, prop_index: number): string => {
                    // if the custom property name has a underscore (_) in it assume it's for 
                    // an associated service
                    if(customProperty.name.includes('_')) {
                        return customProperty.name.split('_')[0];
                    }
                }
            )
        }
    )
    
    type ServiceToken = {
        token: KeyVaultSecret,
        refresh?: KeyVaultSecret,
        expiry?: Date
    }

    // Associative array (object) to remove duplicates
    const user_service_tokens_assoc: {[external_service_name: string]: ServiceToken|null} = {};

    for(var service_index=0;service_index < user_service_token_names.length;service_index++) {
        for(var token_index=0;token_index < user_service_token_names[service_index].length;token_index++) {
            const external_service_name = user_service_token_names[service_index][token_index];

            // If it doesn't already exist in the associative array create it
            if(!user_service_tokens_assoc.hasOwnProperty(external_service_name)) {
                user_service_tokens_assoc[external_service_name] = null;
            }
        }
    }

    await Promise.all(
        Object.keys(user_service_tokens_assoc).map( // Go over each custom property to find it's associated token
            async (external_service_name: string, index: number): Promise<void> => {
                // Get the tokens
                user_service_tokens_assoc[external_service_name] = await getServiceTokens(user, external_service_name);
            }
        )
    );
    
    user.services.forEach( // Go over each (internal) service to assign the newly aquired tokens to the custom properties looking for them
        (service: AccessToServices, index: number) => {
            service.service.properties.customProperties.forEach( // Go over each custom property (for each service) to assign them the appropraite value from the (external) service tokens
                (customProperty: ServiceCustomUserProperty, prop_index: number) => {
                    // We only assign stuff if they were one of those related to an (external) service token
                    if(customProperty.name.includes('_')) {
                        const external_service_name: string = customProperty.name.split('_')[0];
                        const related_tokens = user_service_tokens_assoc[external_service_name];
                        const token_type = customProperty.name.split('_')[customProperty.name.split('_').length - 1];
                        customProperty.value = related_tokens[token_type];
                    }
                }
            )
        }
    )
}

/*async function get_user_from_redis(email: string): Promise<{error: any, user: Express.User}|null> {
    // Get the Redis client
    let redis = redisClient;

    // Check that the Redis connection is open.
    // If not, open a new connection
    if(!redis.isOpen) {
        redis = await startRedisConnection();
    }
    
    // Check if the record exists in Redis
    let redisResponse = await redis.exists(email);
    
    // DEBUGGING: To see that redis is returning properly
    console.log('Redis Response: ' + redisResponse);

    // Check if the user data exists in Redis
    if(redisResponse) {
        // Get the user data from Redis
        const data: string = await redis.get(email);
        const user: Express.User = JSON.parse(data);
        
        // DEBUGGING: Make sure the respons was parsed properly
        //console.log('Data from redis: ' + JSON.stringify(user));
        
        return {
            error: null, 
            user: user
        };
    }

    // Default return if it didn't exist etc...
    return null;
}*/

async function get_user_from_db(email: string): Promise<{error: any, user: Express.User}> {
    // Get the database adapter (abstraction to more easily query across DBMSs etc...)
    const db_adapter: DBAdapter = await get_db_adapter();
    
    return new Promise(
        (resolve: (value: {error: any, user: Express.User}) => void, reject: (reason?: any) => void) => {
            // Query the database for a user with the given email address
            db_adapter.findUserByEmail(
                email, 
                async (err, user: Express.User) => {
                    if(err != null) {
                        reject(err);
                    }
                    
                    // Populate the values of service specific tokens
                    await addServiceTokensToUser(user);
                    
                    // Get the user's tokens
                    //const tokens = await getServiceTokens(user, 'youtube');
                    
                    console.log('User From DB (Adding To Redis): ' + JSON.stringify(user));
                    
                    resolve({
                        error: err, 
                        user: user
                    });
                }
            );
        }
    );
}

/**
 * Adds the user to Redis this is for when it's not found in Redis and so 
 * falls back to database but then we want to add it to Redis so that 
 * it's faster the next time got to get the information (hence it's a 
 * cache)
 * 
 * One thing to note that isn't implemented here that will likely need to 
 * be in the future is cache invalidation/expiration because caches need 
 * to be managed properly to be efficient especially with lots of 
 * concurrent requests etc...
 * 
 * @param email The email to aasscite th userr to within Redis
 * @param user The user thats being associated to in Redis
 */
/*async function add_user_data_to_redis(email: string, user: Express.User) {
    // Get the Redis client
    let redis = redisClient;

    // Check that the Redis connection is open.
    // If not, open a new connection
    if(!redis.isOpen) {
        redis = await startRedisConnection();
    }
    
    // Cache the user data in Redis
    const result: string = await redis.set(email, JSON.stringify(user));
}*/

async function get_user_data_from_cache_or_db(email: string): Promise<{error: any, user: Express.User}> {
    try {
        // Because we differnt types of caches might be availabe (not 
        // implemented yet) we need to set an initial value and reset 
        // based on an if...else if... blck
        let user_data: {error: any, user: Express.User} = null;
        
        // Attempt to get the data from the cache based on the type of cache used
        if(process.env.CACHE_TYPE === 'Redis') {
            //user_data = await get_user_from_redis(email);
        }

        // Check if the user data has already been set
        // 
        // Note: if the `CACHE_TYPE` environment variable is 
        //       misconfigured or it wasn't found in the 
        //       configured cache (most likely Redis) than this flow 
        //       is triggered to get the user data from the database
        if(user_data == null) {
            user_data = await get_user_from_db(email); 

            // Add the data gotten from the databas to thtcc
            if(process.env.CACHE_TYPE === 'Redis') {
                //await add_user_data_to_redis(email, user_data['user']);
            }
        }

        return user_data;
    }
    catch(err) {
        console.log('Error?: ' + err);
        return {
            error: err, 
            user: null
        };
    }
}

/**
 * Provies a wrapper function wheither to use cache or not.
 * 
 * This is mostly as an initial cost saving effort as not having a cache 
 * while using SQLlite database makes sense.
 * 
 * @param email 
 * @returns 
 */
async function get_user_data(email: string): Promise<{error: any, user: Express.User}> {
    if('CACHE_TYPE' in process.env) {
        return get_user_data_from_cache_or_db(email);
    }
    else {
        return get_user_from_db(email);
    }
}

/**
 * Deserilize the user from the session
 * Part of setup for passport.initialize()
 * 
 * NOTE: The implementation of this method makes heavy use of 
 *       Redis to get user information from the cache rather than 
 *       constantly going to the database.
 * TO-DO: Look into cache validation/invalidation strategies so 
 *        that information doesn't take up unneccessary space and 
 *        doesn't get out of sync with the database.
 */
passport.deserializeUser(
    async (email: string, done) => {
        // DEBUGGING: to make sure we're calling the serialization when we should be
        console.log('Deserializing: ' + JSON.stringify(email));
        
        // Get the user data
        const user_data = await get_user_data(email);
        
        // Pass along to callback
        done(user_data['error'], user_data['user']);
    }
);

/**
 * Verification function used by Local Passport strategy to sign user in.
 * 
 * @param email 
 * @param password 
 * @param done 
 */
const verify: Local.VerifyFunction = async (email, password, done) => {
    console.log('Inside passport-local callback with. Called with:\n\tEmail: ' + JSON.stringify(email) + '\n\tPassword: ' + password + '\n');

    const db_adapter: DBAdapter = await get_db_adapter();

    // Lookup the user in the database and compare the password/hashed password
    await db_adapter.findUserByEmail(email, 
        async function(err, user: Express.User) {
            console.log('Got user: ' + JSON.stringify(user) + ' folling password validation password validation');
            
            // Essentially, check for any errors
            //
            // THis can mean:
            //     - When the err (error) parameter is set for the 
            //       callback indicating an error occured during 
            //       lookup
            //     - The user isn't set for some reason (this is 
            //       more just in case, shouldn't occur much in practice)
            //     - Password validation failed (Note, we do 
            //       password validation at the database adapter 
            //       level. This is so that we can limit exposure of 
            //       the password by limiting the scope we need the 
            //       password at to as little as possible)
            if (err || !user || !db_adapter.validatePassword(user.email, password)) {
                done(err, null)
            }
            else {
                // Get the user's tokens
                const tokens = await getServiceTokens(user, 'youtube');
                
                // Cache the user data in Redis
                //const result: string = await redis.set(email, JSON.stringify(user));
                //await redis.disconnect();
                done(err, user)
            }
        }
    );
};

passport.use(
    new Local.Strategy(
        {
            usernameField: 'email',
            session: true
        },
        verify
    )
)

export default passport
