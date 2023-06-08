import { useState, useEffect } from 'react';
import Router from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Form, Button } from 'react-bootstrap';

import { useUser } from '../../lib/hooks';

import FormWithRequiredInput from '../../components/forms/FormWithRequiredInput';
import RequiredInput from '../../components/forms/RequiredInput';
import ShowablePassword from '../../components/forms/ShowablePassword';
import FormInfo from '../../components/forms/FormInfo';

import styles from '../../styles/user.module.css';

export default function SignupPage() {
    const [user, { mutate }] = useUser()
    const [errorMsg, setErrorMsg] = useState('')

    async function onSubmit(e) {
        e.preventDefault()

        // If the password and repeat password don't match notify the user 
        // and go no further
        if (e.currentTarget['user-password'].value !== e.currentTarget.rpassword.value) {
            setErrorMsg(`The passwords don't match`);
            return;
        }

        // Build the request body
        const body = {
            "account-name": e.currentTarget['account-name'].value,
            "user-fname": e.currentTarget['user-fname'].value,
            "user-lname": e.currentTarget['user-lname'].value,
            "user-password": e.currentTarget['user-password'].value,
            "user-email": e.currentTarget['user-email'].value,
        }

        // make the request to the server API endpoint
        const res = await fetch(
            '/api/user',
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(body),
                mode: 'cors',
                credentials: 'include'
            }
        );

        // Verify a successful reponse or provide an error message
        if (res.status === 201) {
            //const userObj = await res.json()

            // set user to useSWR state
            //mutate(userObj)
            Router.push('/users/Login')
        }
        else {
            setErrorMsg(await res.text())
        }
    }

    useEffect(
        () => {
            // redirect to home if user is authenticated
            if (user)
                Router.push('/')
        },
        [user]
    );

    return (
        <>
            <Head>
                <title>Create An Account</title>
            </Head>

            <h1>Create An Account</h1>
            {
                errorMsg && <p className={styles.error}>{errorMsg}</p>
            }
            <div className={(errorMsg) ? styles['form-container'] : styles['form-container-error']}>
                <FormWithRequiredInput onSubmit={onSubmit}>
                    <Form.Group>
                        <RequiredInput type="email" label="Email" inputName="user-email" />
                    </Form.Group>
                    <Form.Group>
                        <ShowablePassword label="Password" inputName="user-password" isRequired={true} />
                    </Form.Group>
                    <Form.Group>
                        <ShowablePassword label="Repeat Password" inputName="rpassword" isRequired={true} />
                    </Form.Group>
                    <hr />
                    <Form.Group>
                        <RequiredInput type="text" label="Account Name" inputName="account-name">
                            {' '}
                            <FormInfo text='Account Name is a way of associating the individual user being created here (you) with a larger "account". That is, to enable groups or organizations to have shared access to services. Individuals would likely use their own name or a well known, unique alias.' />
                        </RequiredInput>
                    </Form.Group>
                    <hr />
                    <Form.Group>
                        <Form.Label htmlFor="user-fname">First Name</Form.Label>
                        <Form.Control type="text" name="user-fname" id="user-fname" />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label htmlFor="user-lname">Last Name</Form.Label>
                        <Form.Control type="text" name="user-lname" id="user-lname" />
                    </Form.Group>
                    <br />
                    <Form.Group>
                        <Form.Check type="checkbox" label={<Form.Label htmlFor="terms-agree">I have read and accept the <Link href="/Terms" passHref><a>Terms of Service</a></Link></Form.Label>} name="terms-agree" id="terms-agree" required />
                    </Form.Group>
                    <br />
                    <div className="submit">
                        <Button variant="primary" type="submit">Sign up</Button>
                        {' '}
                        <Link href="/user/Login" passHref>
                            <a>I already have an account</a>
                        </Link>
                    </div>
                </FormWithRequiredInput>
            </div>
        </>
    )
}
