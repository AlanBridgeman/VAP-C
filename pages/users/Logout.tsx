import { useEffect } from 'react';
import Router from 'next/router';
import nc from 'next-connect';
import redis from '../../lib/redis';
import { useUser } from '../../lib/hooks';
import auth from '../../middleware/auth';

/**
 * The page component itself
 * 
 * @param props 
 * @returns 
 */
export default function Logout(props) {
    // Hook for getting user inforamtion etc...
    const [user, { loading }] = useUser();

    // Ensure the user is signed in etc...
    useEffect(
        () => {
            // redirect user to login if not authenticated
            if (!loading && !user) Router.replace('/users/Login')
        },
        [user, loading]
    )

    // Build and return the actual page JSX
    return (
        <>
            <h1>Logout</h1>
            <p>{props.message}</p>
        </>
    );
}

/*export async function getServerSideProps(context) {
    const message = await fetch('http://localhost:3000/api/users/Logout', { method: 'GET' }) // Call the API route to manipulate the session
        .then(r => r.json())   // Get the JSON response from API route
        .then( // Call the following function with that JSON data
            (data) => {
                // Return some JSX/HTML to show the user they were logged out successfully
                return data.message
            }
        );
    
    return {
        props: {
            message: message
        }
    }
}*/
/**
 * Needed server side processing (actual logging out) ahead of page load
 * 
 * @param object An object holding request/response objects
 * @returns 
 */
export async function getServerSideProps({ req, res }) {
    // Next Connect (nc) middleware handler
    const handler = nc();

    try {
        // Use authentication middleware (which includes Passport)
        await handler.use(auth).run(req, res);
        
        // Remove from cache if caching is enabled
        if('CACHE_TYPE' in process.env) {
            await redis.del(req.user.email);
            await redis.quit();
        }

        // Use Passport's logout method
        await req.logOut();

        // Delete/Destroy session information
        await req.session.destroy();

        // Let the user know they were successfully signed out
        return {
            props: {
                message: "You've been successfully logged out!"
            }
        }
    }
    catch(e) {
        throw e;
        //console.log('An error occured: ' + e.statusCode + ' - ' + e.statusMessage + ' - ' + Object.getOwnPropertyNames(e));
    }
}