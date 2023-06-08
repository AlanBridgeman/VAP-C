/*
 *************************************************************
 * Name: redis.ts (Redis Client Aquisition/Creation)
 * Description: Because Redis (specifically Azure Cache for 
 *              Redis) connections have concurrent client 
 *              limitations keeping client connection amounts 
 *              low is ideal (see C0 at https://azure.microsoft.com/en-ca/pricing/details/cache/#Basic)
 *
 * Side Note: Because this has "top-level awaits" for opening 
 *            the Redis connection, this now requires enabling 
 *            a special flag (experiments.topLevelAwait) 
 *            within WebPack this meant implementing a 
 *            WebPack configuration override in 
 *            next.config.js
 *            These awaits may also show as errors within VS 
 *            Code for similar reasons
 * 
 * See Also: https://redis.io/
 * 
 * Author: Alan Bridgeman
 * Created: January, 29th 2022
 *************************************************************
 */

import { createClient, RedisClientType } from 'redis';

//
// Redis is attached to the `global` object in development in the hopes 
// to mitigate and/or prevent exhausting connection limit.
//
// TO-DO: Look into https://gist.github.com/JonCole/925630df72be1351b21440625ff2671f#file-redis-bestpractices-node-js-md

export async function startRedisConnection() {
    let redisClient: RedisClientType<any, any>;

    //if (process.env.NODE_ENV === 'production') {
        
        // I hate this so, so, so very much but I have to hard code values 
        // here otherwise ```yarn build``` in the Github Actions workflow
        // doesn't work because for whatever reason it doesn't see 
        // environment variables properly (or something...)
        const redisHost = /*process.env.REDIS_CACHE_HOSTNAME;*/ 'ppe-alanbridgeman-ca.redis.cache.windows.net';
        const redisPassword = /*process.env.REDIS_CACHE_KEY;*/ 'uXS6ciBMdFNlCDv8mC3Snje1wdtItzkgZAzCaHvsapo=';
        
        redisClient = createClient({socket: {host: redisHost, port: 6380, tls: true}, password: redisPassword });
        redisClient.on('error', (err) => console.log('Redis Client Error', err));
        await redisClient.connect();
    /*}
    else {
        if (!global.redis) {
            global.redis = createClient({socket: {host: process.env.REDIS_CACHE_HOSTNAME, port: 6380, tls: true}, password: process.env.REDIS_CACHE_KEY});
            global.redis.on('error', (err) => console.log('Redis Client Error', err));
            await global.redis.connect();
        }
        redisClient = global.redis
    }*/
    
    return redisClient;
}

export default await startRedisConnection();