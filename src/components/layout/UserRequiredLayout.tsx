import React, { useEffect } from 'react';
import { KeyedMutator } from 'swr';

import { useUser } from '../../lib/hooks';
import { User } from '../../types/User';

/**
 * Provides a definition for the properties we expect or may see within this component
 * 
 * onNoUser [() => void|Promise<void>] - A void callback to use if there is no user on this page (NOTE: this is never actually displays so has to be a void function)
 * onLoading [() => JSX.Element|void|Promise<void>] - A callback to use while the page is loading (this can be JSX to display or a void function doing some other functionality)
 * children [any[]] - An array of the children of this element (used for displaying after loading)
 */
interface props {
    onNoUser?: () => void | Promise<void>,
    onLoading?: () => JSX.Element | void | Promise<void>,
    children?: JSX.Element | JSX.Element[]
}

/**
 * The body of the component where the 
 * 
 * @param props - The set of properties provided to this component
 * @returns - JSX to be displayed for this component
 */
export default function UserRequiredLayout/*Wrapper*/(props: props) {
    // Use the custome useUser hook to get the user
    const [user, { mutate, loading }]: [User, {mutate: KeyedMutator<any>, loading: boolean}] = useUser();

    // Act accordingly if there is no user
    useEffect(() => {
        if(!loading && !user)
            props.onNoUser()
    }, [user, loading]);

    // Return/perform based on wheither we are loading or 
    return (
        <>
            {loading &&             // While loading
                props.onLoading()   // Call the approprate callback
            }

            {user &&
                React.Children.map( // Loop over the children of this component
                    props.children, 
                    (child) => { // For each child perfomr the following
                        // Check if the child is a valid React component
                        if(React.isValidElement(child)) {
                            // Return the component with the user property now set on it
                            return React.cloneElement(child as React.ReactElement<any>, {
                                user: user,         // Set the user for the child
                                mutate: mutate      // Set the user mutator for the child
                            });
                        }
            
                        // Because it's not a React component just return the child as is
                        return child;
                    }
                )
            }
        </>
    )
}

/**
 * The idea here is to provide an "outer" wrapper of the Layout. This is 
 * required because the children of the layout are manipulated such that 
 * their provided with the user object without having to implement the 
 * underlying functionality/complexity to do so. 
 * 
 * However, because the page component itself utilizes this component it 
 * forces this component to be "lower" and a child of the page component 
 * itself. Which means, if you try to reference the user property this 
 * component sets on it's children from the page component you wouldn't 
 * find anything set. And as a matter of practice, property setting should 
 * only be done "down-stream" which means from parent to child.
 * 
 * One solution might be to take in a setter/handler method that allows you 
 * to set the property at the page level from this component. However, this 
 * feels like it would take away from the original purpose of this component 
 * in terms of simplifying the implementation and feels like this would 
 * quickly get into "hook like" structures which are the primary ones I'm 
 * attempting to abstract/obfuscate away.
 * 
 * Another potential solution was to introduce downstream user components. 
 * That is, to have a UserEmail component that returns the user's email, 
 * a UserName component that returns the user's name etc... that way you 
 * aren't neccessarly trying to access the user with properties at the page 
 * level but with components. However, in it's current implemenation and by 
 * design to some extent I suspect, the setting of a user property is 
 * limited to the immediate children of this component which means unless 
 * you passed it down the chain of components to get it to the where you 
 * wanted the user component, which seems intrusive in it's own right, 
 * than the component won't recieve it. There may be some inherint way to 
 * force React/NextJs to pass properties down to their children but I 
 * haven't been able to find one yet. And even on finding one I'd have to 
 * evaluate performance tradeoffs etc... because I feel like if that exists 
 * it seems likely it would have serious potential to degrade the 
 * performance quickly.
 * 
 * All that said, this has been tabled for the moment; Until such time as 
 * I have more free time to look into it, come across relevant information 
 * or have a sudden inspiration or need for this. The current flow of using 
 * this but doing some wrapping at the page level seems to work and does 
 * provide some simplificaiton (at least in my opinion) 
 * 
 * @param props 
 * @returns 
 */
/*export default function UserRequiredLayout(props: props) {
    return (
        <UserRequiredLayoutWrapper onNoUser={props.onNoUser} onLoading={props.onLoading}>
            {props.children}
        </UserRequiredLayoutWrapper>
    )
}*/