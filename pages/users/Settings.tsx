import { useEffect, useState } from 'react';
import Head from 'next/head';
import Router, { useRouter } from 'next/router';
import nc from 'next-connect';
import { Form, Button } from 'react-bootstrap';
import auth from '../../middleware/auth';
import { retrieveUserProperties } from '../../lib/azure/table-storage';
import { getServiceTokens } from '../../lib/azure/key-vault';
import UserRequiredLayout from '../../components/layout/UserRequiredLayout';
import ShowablePassword from '../../components/forms/ShowablePassword';
import { User } from '../../types/User';
import { AccessToServices } from '../../types/AccessToServices';
import { ServiceCustomUserProperty } from '../../types/ServiceCustomUserProperty';
import { Locale } from '../../types/Locale';

function SettingsContent(props) {
    async function getCustomerId(e) {
        const stripeData = await fetch('/api/payments/create-customer', {
            method: 'POSt',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: props.user.fname + ' ' + props.user.lname,
                email: props.user.email,
                description: 'UID=' + props.user.id + ', AID=' + props.user.account.id
            })
        })
        .then(r => r.json());
        
        const updateUser = await fetch('/api/users/update-user',{
            method: 'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                stripeId: stripeData.cid
            })
        })
        .then(r => r.json());
        
        //(updateUser.stripeId);
    }

    let user: User = props.user;
    let token = JSON.parse(props.token);
    let refresh = JSON.parse(props.refresh);

    return (
        <>
            <Head>
                <title>Settings</title>
            </Head>
            <h1>Settings</h1>
            <Form.Group>
                <Form.Label>ID: </Form.Label>
                {/* See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled */ }
                <Form.Control name="id" value={props.user.id} aria-disabled="true" disabled readOnly={true} />
            </Form.Group>
            <Form.Group>
                <Form.Label>First Name: </Form.Label>
                <Form.Control name="fname" defaultValue={(user.properties.name as {fname: string, lname: string}).fname} />
            </Form.Group>
            <Form.Group>
                <Form.Label>Last Name: </Form.Label>
                <Form.Control name="lname" value={(user.properties.name as {fname: string, lname: string}).lname} />
            </Form.Group>
            <Form.Group>
                <Form.Check type="checkbox" label={<Form.Label htmlFor="terms-agree">Use sing full-name instead</Form.Label>} name="terms-agree" id="terms-agree" required />
            </Form.Group>
            <Form.Group>
                <Form.Label>Email: </Form.Label>
                <Form.Control name="email" value={props.user.email} />
            </Form.Group>
            <Form.Group>
                <Form.Label>Payments (Stripe)</Form.Label>
                { props.user.stripeId &&
                    <Form.Control name="stripeId" value={props.user.stripeId} />
                }
                { !props.user.stripeId &&
                    <>
                        <br />
                        <Button variant='primary' onClick={getCustomerId}>Get Customer ID!</Button>
                    </>
                }
            </Form.Group>
            <h2>Service Specific Settings</h2>
            { 
                user.services.map(
                    (accessToServices: AccessToServices, index: number) => {
                        //console.log(user);
                        //return JSON.stringify(accessToServices.service.properties.customProperties);
                        const router = useRouter();
                        
                        let serviceTitle: string;
                        accessToServices.service.properties.names.forEach(
                            (name: {value: string, locale: Locale}, index: number) => {
                                console.log('Comparing ' + router.locale + ' with ' + name.locale.language + '-' + name.locale.country);
                                if(name.locale.language == router.locale.split('-')[0] && name.locale.country == router.locale.split('-')[1]) {
                                     serviceTitle = name.value;
                                }
                            }
                        );

                        return (
                            <fieldset>
                                <legend>{serviceTitle}</legend>
                                {
                                    accessToServices.service.properties.customProperties.map(
                                        (property: ServiceCustomUserProperty, index: number) => {
                                            return (
                                                <Form.Group>
                                                    <ShowablePassword label={(<>Token ({property.name}):</>)} inputName={property.name} value={property.from} />
                                                </Form.Group>
                                            );
                                        }
                                    )
                                }
                            </fieldset>
                        )
                    }
                )
            }
            <Form.Group>
                <ShowablePassword label={(<>Token ({token.name}):</>)} inputName="token" value={token.value} />
            </Form.Group>
            <Form.Group>
                <ShowablePassword label={(<>Refresh Token ({refresh.name}):</>)} inputName="refresh-token" value={refresh.value} />
                {/*props.approver_email*/}
            </Form.Group>
        </>
    );
}

export default function Settings(props) {
    return (
        <UserRequiredLayout onNoUser={() => { Router.replace('/users/Login'); }} onLoading={() => { return <p>Loading...</p> }}>
            <SettingsContent token={props.token} refresh={props.refresh} approver_email={props.approver_email} />
        </UserRequiredLayout>
    );
}

export async function getServerSideProps({ req, res }) {
    const handler = nc();
    try {
        await handler.use(auth).run(req, res);
        
        const props = await retrieveUserProperties(req.user.aId, req.user.id);
        const { token, refresh } = await getServiceTokens(req.user, 'youtube');
        
        return { 
            props: { 
                token: JSON.stringify(token), 
                refresh: JSON.stringify(refresh), 
                //approver_email: props['approver'] 
            }
        };
    }
    catch(err) {
        console.log('An error occured: ' + err);
        return {
            props: {
                token: JSON.stringify({name: '', value: 'Not Available (Error)'}),
                refresh: JSON.stringify({name: '', value: 'Not Available (Error)'}),
                approver_email: 'Not Available (Error)'
            }
        };
    }
}