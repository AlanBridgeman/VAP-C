import Head from 'next/head';
import Image from 'next/image';
import Router from 'next/router';

// Load the required libraries for Azure Table access
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
// Load the required libraries for Azure Key Vault
import { SecretClient } from '@azure/keyvault-secrets';
import { ClientSecretCredential } from '@azure/identity';

import { Table } from 'react-bootstrap';

import UserRequiredLayout from '../components/layout/UserRequiredLayout';

import styles from '../styles/Home.module.css';

async function get_blob_url(id) {
    const apiReturn = await fetch('/api/get-blob-info?' + new URLSearchParams({id: id}))
        .then(r => r.json())
        .then(data => {
            return data.url
        });

    return apiReturn;
}

async function send_trigger(id, user) {
    const url = await get_blob_url(id)

    const params = {
        url:encodeURIComponent(url),
        user:user
    }

    const apiUrl = '/api/start-cloud-processing?' + new URLSearchParams(params);

    // Use an API route to trigger an addition to the trigger Azure Queue
    // which then triggers the Video-Processing-Func Azure Function to do
    // the actual "rendering" etc... and then triggers the logic app etc...
    fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
        // To-Do: Implement some kind of non-intrusive notification
        alert(data.message);
    });
}

function DashboardContent(props) {
    let token = JSON.parse(props.token);
    let refresh = JSON.parse(props.refresh);

    return (
        <>
            <Head>
                <title>{props.user.email}&apos;s Dashboard</title>
                <meta name="description" content="Generated by create next app" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <h1 className={styles.title}>
                Welcome to {props.user.email}&apos;s <a href="https://nextjs.org">Next.js!</a>
            </h1>

            <Table style={{maxWidth: '100%', display: "block", overflow:"hidden"}} striped bordered hover variant="dark">
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>Refresh Token</th>
                        <th>Approver</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{maxWidth: "30%", overflow: "scroll"}}><small>{token.value}</small> ({token.name})</td>
                        <td style={{maxWidth: "30%"}}><small>{refresh.value}</small> ({refresh.name})</td>
                        <td style={{maxWidth: "30%"}}>{props.approver_email}</td>
                    </tr>
                </tbody>
            </Table>

            <button onClick={() => send_trigger(1, props.user)}>Trigger!</button>

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

export async function getServerSideProps({ req, res }) {
    // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
    const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
    const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;
    const STORAGE_TABLE_NAME = process.env.STORAGE_TABLE_NAME;

    // Azure Key Vault Credentials from environment variables (for security)
    const KEYVAULT_NAME = process.env.KEYVAULT_NAME;
    const KEYVAULT_TENANT_ID = process.env.KEYVAULT_TENANT_ID;
    const KEYVAULT_CLIENT_ID = process.env.KEYVAULT_CLIENT_ID;
    const KEYVAULT_CLIENT_SECRET =  process.env.KEYVAULT_CLIENT_SECRET;
    
    // Create the Azure Table Client
    const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
    const tableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, STORAGE_TABLE_NAME, tableCredential);

    //const user = req.query.user;
    const entity = await tableClient.getEntity<{partitionKey: string, rowKey: string, token: string, refresh: string, approver: string}>('Account1', 'User1')

    // Create the Key Vault Client
    const secretCredential = new ClientSecretCredential(KEYVAULT_TENANT_ID, KEYVAULT_CLIENT_ID, KEYVAULT_CLIENT_SECRET);
    const url = "https://" + KEYVAULT_NAME + ".vault.azure.net";
    const secretClient = new SecretClient(url, secretCredential);

    // Read the secret we created
    const tokenSecret = await secretClient.getSecret(entity.token);
    const refreshSecret = await secretClient.getSecret(entity.refresh);

    // Create Key Vault secrets for the YouTube Access Token and Refresh Token
    //const uniqueString = new Date().getTime();
    //const tokenSecretName = `youtube-token-${uniqueString}`;
    //const refreshTokenSecretName = `youtube-refresh-token-${uniqueString}`;
    //const tokenResult = await secretClient.setSecret(tokenSecretName, data.access_token);
    //const refreshResult = await secretClient.setSecret(refreshTokenSecretName, data.refresh_token);

    console.log('Token: ' + JSON.stringify(tokenSecret));

    return { 
      props: { 
        token: JSON.stringify(tokenSecret), 
        refresh: JSON.stringify(refreshSecret), 
        approver_email: entity.approver 
      }
    };
}
