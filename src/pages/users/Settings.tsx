import { useEffect } from 'react';
import Router from 'next/router';
import { useUser } from '../../lib/hooks';
import { User } from '../../types/User';

export default function Profile() {
    const [user, { loading }]: [User, { loading: boolean }] = useUser();
    
    useEffect(() => {
        if(!loading && !user) Router.replace('/users/Login');
    }, [user, loading]);
    
    return (
        <>
            <head>
                <title>Settings</title>
            </head>
            {loading && (
                <p>Loading...</p>
            )}
            {user && (
                <>
                <h1>Settings</h1>
                <p>{user.id}</p>
                <p>{user.fname}</p>
                <p>{user.lname}</p>
                <p>{user.email}</p>
                </>
            )}
        </>
    );
}