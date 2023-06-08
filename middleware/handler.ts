import { NextApiResponse } from 'next';
import ExtendedRequest from '../types/ExtendedRequest';
import nextConnect, { NextConnect } from 'next-connect';
import auth from './auth'

/**
 * Use of these functions can be as simple as (for an API route):
 * ```typescript
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler = GET<T>(getFunc);
 * export default handler;
 * ```
 * 
 * It's also possible to chain for multiple method handling:
 * ```typescript
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function postFunc(req: ExtndedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler_one = GET<T>(getFunc);
 * const handler_two = POST<T>(postFunc, [], handler_one);
 * export default handler_two;
 * ```
 * 
 * As the name implies, this also streamlines utilizing middleware
 * ```typescript
 * // Note, we assume middleware is `export default`'d here
 * import middleware from '.../middleware/...';
 * ...
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler = GET<T>(getFunc, [middleware]);
 * export default handler;
 * ```
 * 
 * It's also possible to query what middleware is already used
 * ```typescript
 * // Note, we assume middleware is `export default`'d here
 * import middleware from '.../middleware/...';
 * ...
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function postFunc(req: ExtndedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler_one = GET<T>(getFunc);
 * 
 * let handler_two: MiddlewareHandler;
 * if(typeof handler_one.middleware !== 'undefined' && !handler_once.middleware.includes(middleware)) {
 *     handler_two = POST<T>(postFunc, [middleware], handler_one);
 * }
 * else {
 *     handler_two = POST<T>(postFunc, [], handler_one);
 * }
 * 
 * export default handler_two;
 * ```
 */
export type MiddlewareHandler<T> = NextConnect<ExtendedRequest, NextApiResponse<T>> & {
    middleware?: NextConnect<ExtendedRequest, NextApiResponse>[]
};

function createOrGetHandler<T>(handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    if(typeof handler === 'undefined') {
        // Setup the middleware handler
        handler = nextConnect<ExtendedRequest, NextApiResponse<T>>();
    }
    return handler;
}

/**
 * Apply middlewares to the handler
 * 
 * @param middlewares List of middleware to apply to the handler
 * @param handler The handler to apply the middleware to
 * @returns 
 */
function applyMiddleware<T>(middlewares: NextConnect<ExtendedRequest, NextApiResponse>[], handler: MiddlewareHandler<T>) {
    let outputHandler: MiddlewareHandler<T> = handler;
    
    // Apply any middlewares
    middlewares.forEach(
        (middleware: NextConnect<ExtendedRequest, NextApiResponse>, middlewareIndex: number, middlewareList: NextConnect<ExtendedRequest, NextApiResponse>[]) => {
            if(typeof outputHandler.middleware === 'undefined' || !handler.middleware.includes(middleware)) {
                outputHandler = outputHandler.use(middleware);
                if(typeof outputHandler.middleware === 'undefined') {
                    outputHandler.middleware = [];
                }
                outputHandler.middleware.push(middleware);
            }
        }
    );

    return outputHandler;
}

export function GET<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    // Create the base handler if neccessary
    handler = createOrGetHandler(handler);

    // Apply any middlewares
    handler = applyMiddleware(middlewares, handler);

    // Apply the callback
    handler = handler.get(func);
    
    // Return the object (with middleware and callbacks applied)
    return handler;
}

export function POST<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    // Create the base handler if neccessary
    handler = createOrGetHandler(handler);

    // apply any middleware
    handler = applyMiddleware(middlewares, handler);

    // Apply the callback
    handler = handler.post(func);
    
    // Return the object (with middleware and callbacks applied)
    return handler;
}

export function PUT<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    // Create the base handler if neccessary
    handler = createOrGetHandler(handler);

    // apply any middleware
    handler = applyMiddleware(middlewares, handler);

    // Apply the callback
    handler = handler.put(func);
    
    // Return the object (with middleware and callbacks applied)
    return handler;
}

export function DELETE<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    // Create the base handler if neccessary
    handler = createOrGetHandler(handler);

    // apply any middleware
    handler = applyMiddleware(middlewares, handler);

    // Apply the callback
    handler = handler.delete(func);
    
    // Return the object (with middleware and callbacks applied)
    return handler;
}

function callMiddlewareMethod<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, method: string, middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    if(method === 'GET') {
        return GET<T>(func, middlewares, handler);
    }
    else if(method === 'POST') {
        return POST<T>(func, middlewares, handler);
    }
    else if(method === 'PUT') {
        return PUT<T>(func, middlewares, handler);
    }
    else if(method === 'DELETE') {
        return DELETE<T>(func, middlewares, handler);
    }
}

/**
 * Generic function to allow for specifying the method(s) as a parameter
 * 
 * This is particularly helpful when you have a callback you want to use for multiple methods. For instance:
 * ```typescript
 * function callback(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler_one = GET<T>(callback);
 * const handler_two = POST<T>(callback, [], handler_one);
 * export default handler_two;
 * ```
 * Can be simplified to
 * ```typescript
 * function callback(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler = useMiddleware(callback, ['GET', 'POST']);
 * export default handler;
 * ```
 * 
 * @param {(req: ExtendedRequest, res: NextApiResponse<T>) => void | Promise<void>} func The callback to use when a method of the specified type(s) come into the route 
 * @param {string | string[]} method The method(s) to apply the callback for
 * @param {NextConnect<ExtendedRequest, NextApiResponse>[]} middlewares List of middlewares to use
 * @param {MiddlewareHandler<T> | undefined} handler The handler to apply actions to (used for chaining actions together)
 * @returns {MiddlewareHandler<T>} The handler that gets generated from the spedified action(s)
 */
export function useMiddleware<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, method: string | string[], middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    if(typeof method === 'string') {
        return callMiddlewareMethod(func, method, middlewares, handler);
    }
    else {
        let handlerForMultiple: MiddlewareHandler<T>;
        if(typeof handler === 'undefined') {
            handlerForMultiple = nextConnect<ExtendedRequest, NextApiResponse<T>>();
        }
        else {
            handlerForMultiple = handler;
        }

        method.forEach(
            (methodToUse: string, methodIndex: number, methodList: string[]) => {
                handlerForMultiple = callMiddlewareMethod(func, methodToUse, middlewares, handlerForMultiple);
            }
        )

        return handlerForMultiple;
    }
}

/**
 * Convenience wrapper function to use the `auth` middleware
 * 
 * So, instead of:
 * ```typescript
 * import auth from '.../middleware/auth';
 * ...
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * export default GET<T>(getFunc, [auth]);
 * ```
 * 
 * Note, `GET<T>(func, middlewares, handler)` is functionally equivalent to `useMiddleware(func, 'GET', middlewares, handler)`
 * 
 * It becomes:
 * ```typescript
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * export default useAuthMiddleware(getFunc, 'GET');
 * ```
 * This isn't just about removing lines of code but rather centralizing the depedency so that if the location or name of the auth middleware changes it would only need to be updated in one place rather than multiple.
 * 
 * Do notice, that one of the arguments to this function is the method(s) to apply the auth middleware for (because it uses {@link useMiddleware} behind the scenes for simplicity) 
 * 
 * That said, this method still returns a `MiddlewareHandler` object and can be chained accordingly. Ex:
 * ```typescript
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function postFunc(req: ExtndedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler_one = useAuthMiddleware(getFunc, 'GET');
 * const handler_two = POST(postFunc, [], handler_one);
 * export default handler_two;
 * ```
 * or even:
 * ```typescript
 * function getFunc(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function postFunc(req: ExtndedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * const handler_one = GET(getFunc);
 * const handler_two = useAuthMiddleware(postFunc, 'POST', [], handler_one);
 * export default handler_two;
 * ```
 * A case where this kind of chaining may make sense is something like:
 * ```typescript
 * function returnData(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function returnStatusCodeOnly(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * export default useMiddleware(returnStatusCodeOnly, ['PUT', 'DELETE'], [], useAuthMiddleware(returnData, ['GET', 'POST']));
 * ```
 * While not the most intuitive to read etc... this gives the idea because for both GET and POST it's common to return data back to the user where PUT and DELETE are usually just a status code.
 * 
 * Note, the unintuitive part of the above code is that all 4 (GET, POST, PUT, and DELETE) actually have the auth middleware this is because it's done sequentially. if you did the following instead it would ONLY apply to GET and POST
 * ```typescript
 * function returnData(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * function returnStatusCodeOnly(req: ExtendedRequest, res: NextApiResponse<T>) {
 *     ...
 * }
 * ...
 * export default useAuthMiddleware(returnData, ['GET', 'POST'], [], useMiddleware(returnStatusCodeOnly, ['PUT', 'DELETE']));
 * ```
 * Now, you could replace `useMiddleware` with `useAuthMiddleware` in the original bloc (not the last one but the one before that where all 4 have the auth middleware) for readability but this would just be for readability
 * 
 * @param {(req: ExtendedRequest, res: NextApiResponse<T>) => void | Promise<void>} func The callback to use when a method of the specified type(s) come into the route 
 * @param {string | string[]} method The method(s) to apply the callback for
 * @param {NextConnect<ExtendedRequest, NextApiResponse>[]} middlewares List of other (other than auth) middlewares to use
 * @param {MiddlewareHandler<T> | undefined} handler The handler to apply actions to (used for chaining actions together)
 * @returns {MiddlewareHandler<T>} The handler that gets generated from the spedified action(s)
 */
export function useAuthMiddleware<T>(func: (req: ExtendedRequest, rex: NextApiResponse<T>) => void | Promise<void>, method: string | string[], middlewares: NextConnect<ExtendedRequest, NextApiResponse>[] = [], handler?: MiddlewareHandler<T>): MiddlewareHandler<T> {
    return useMiddleware<T>(func, method, [auth, ...middlewares], handler);
}