import { useEffect } from 'react';
import Router from 'next/router';
import { withIronSessionSsr } from 'iron-session/next';
import { useUser } from '../../lib/hooks';
import { sessionOptions } from '../../lib/session';

export default function Logout(props) {
    const [user, { loading }] = useUser()
  
    useEffect(() => {
        // redirect user to login if not authenticated
        if (!loading && !user) Router.replace('/users/Login')
    }, [user, loading])
  
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

export const getServerSideProps = withIronSessionSsr(
    async function getServerSideProps({ req }) {
        await req.session.destroy();

        return {
            props: {
                message: "You've been successfully logged out!"
            }
        }
    },
    sessionOptions
);