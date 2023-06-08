import Head from 'next/head';
import Image from 'next/image';
import Router from 'next/router';

import { QueueSendMessageResponse } from '@azure/storage-queue';

import { Table, Button } from 'react-bootstrap';

import { useTokens } from '../lib/hooks';

import UserRequiredLayout from '../components/layout/UserRequiredLayout';

import { Token } from '../types/Token';

import styles from '../styles/Home.module.css';

/**
 * Get the URL of the BLOB containering the data with the name matching that provided
 * 
 * @param name The name of the BLOB to get the URL for
 * @returns {Promise<string | null>} The BLOF's URL if found. Null otherwise 
 */
async function get_blob_url(name: string): Promise<string | null> {
    const apiReturn: string | void = await fetch('/api/get-blob-info?' + new URLSearchParams({name: name}))
        .then(
            (r: Response) => {
                // Check that the response returned successful
                if(r.ok) {
                    return r;
                }

                // Because the request didn't return successfuly throw an error (triggering the catch)
                throw new Error(`A ${r.status.toString()} error occured while getting the BLOBs URL.`);
            }
        )
        // Conver to easily usable object
        .then(async (r: Response) => await r.json())
        // Get the URL from the returned data
        .then((data: { url: string}) => data.url)
        // Print any errors to the console if they occur
        .catch(reason => console.log(reason));

    return (typeof apiReturn === 'string' ? apiReturn : null);
}

async function send_trigger(name: string): Promise<void> {
    const url: string | null = await get_blob_url(name)

    // Verify we got a URL back (didn't error)
    if(url !== null) {
        // URL parameter mapping
        const params = {
            url: encodeURIComponent(url)
        };

        // The API url
        const apiUrl = '/api/cloud-processing?' + new URLSearchParams(params);

        // Use an API route to trigger an addition to the trigger Azure Queue
        // which then triggers the Video-Processing-Func Azure Function to do
        // the actual "rendering" etc... and then triggers the logic app etc...
        fetch(apiUrl, { method: 'POST' })
            .then(
                (r: Response) => {
                    // Check that the response returned successful
                    if(r.ok) {
                        return r;
                    }

                    // Because the request didn't return successfuly throw an error (triggering the catch)
                    throw new Error(`A ${r.status.toString()} error occured while getting the BLOBs URL.`);
                }
            )
            .then(r => r.json())
            .then(
                (data: { message: string, response: QueueSendMessageResponse }) => {
                    // Print the actual Azure reponse to the console (for debugging purposes)
                    console.log(JSON.stringify(data.response));
                    
                    // To-Do: Implement some kind of non-intrusive notification
                    alert(data.message);
                }
            )
            .catch(reason => console.log(reason));
    }
}

async function add_operation(operation: string) {
    const body = {
        operation: operation
    };
    
    // Use an API route to add (PUT) a new operation to the operations Azure Queue
    // which is then used durin the remote Azure Function processing to determine 
    // what operations to do
    fetch(
        '/api/cloud-processing',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(body)
        }
    )
        .then(
            (r: Response) => {
                // Check that the response returned successful
                if(r.ok) {
                    return r;
                }

                // Because the request didn't return successfuly throw an error (triggering the catch)
                throw new Error(`A ${r.status.toString()} error occured while getting the BLOBs URL.`);
            }
        )
        .then(r => r.json())
        .then(
            (data: { message: string, response: QueueSendMessageResponse }) => {
                // Print the actual Azure reponse to the console (for debugging purposes)
                console.log(JSON.stringify(data.response));
                
                // To-Do: Implement some kind of non-intrusive notification
                alert(data.message);
            }
        )
        .catch(reason => console.log(reason));
}

function DashboardContent(props) {
    const [tokens, { loading: tokens_loading }]: [Token[], { loading: boolean }] = useTokens();

    return (
        <>
            <Head>
                <title>{props.user.email}&apos;s Dashboard</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <h1 className={styles.title}>
                Welcome to {props.user.email}&apos;s Dashboard
            </h1>

            {
                !tokens_loading ?
                    (
                        <Table
                            style={
                                {
                                    maxWidth: '100%',
                                    display: "block",
                                    overflow:"hidden"
                                }
                            }
                            striped
                            bordered
                            hover
                            variant="dark"
                        >
                            <thead>
                                <tr>
                                    <th>Token</th>
                                    <th>Refresh Token</th>
                                    <th>Approver</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    tokens.map(
                                        (token: Token, tokenIndex: number, tokenList: Token[]) => {
                                            return (
                                                <tr>
                                                    <td 
                                                        style={
                                                            {
                                                                maxWidth: "30%", 
                                                                overflow: "scroll"
                                                            }
                                                        }
                                                    >
                                                        <small>{token.secret.value}</small> 
                                                        ({token.secret.name})
                                                    </td>
                                                    <td style={{maxWidth: "30%"}}>
                                                        <small>{token.refresh.value}</small> 
                                                        ({token.refresh.name})
                                                    </td>
                                                    <td style={{maxWidth: "30%"}}>
                                                        {token.approver_email}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                }
                            </tbody>
                        </Table>
                    )
                :
                    ( <p>Loading</p>)
            }

            <Button 
                variant='secondary' 
                onClick={
                    e => {
                        e.preventDefault();
                        add_operation('');
                    }
                }
            >Add Operation</Button>
            <Button
                variant='primary'
                onClick={
                    e => {
                        e.preventDefault();
                        send_trigger('test_0.mp4');
                    }
                }
            >Trigger!</Button>

            <p className={styles.description}>
                Get started by editing{' '}
                <code className={styles.code}>pages/index.js</code>
            </p>
        </>
    );
    //return <p>Hello?</p>
}

/**
 * Provides a wrapper for the dashboard component (needed because of how 
 * UserRequiredLayout works - see the long block comment at the end of 
 * that file for more info)
 * 
 * @param props - A Object (JSON) with three elements as follows
 *                {
 *                    tokens (string - stringfy'd JSON)  - The tokens
 *                    refresh (string - stringfy'd JSON) - The refresh tokens
 *                    approver_email (string)            - The approver's email
 *                }
 * @returns 
 */
export default function Dashboard(props) {  
  return (
        <UserRequiredLayout onNoUser={() => { Router.replace('/users/Login'); }} onLoading={() => { return <p>Loading...</p> }}>
          <DashboardContent token={props.token} refresh={props.refresh} approver_email={props.approver_email} />
        </UserRequiredLayout>
    )
}