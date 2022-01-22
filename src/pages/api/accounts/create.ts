import { NextApiRequest, NextApiResponse } from 'next';

import Stripe from 'stripe';
const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY,
    {
        apiVersion: "2020-08-27"
    }
);

/**
 * Create an account for a new user
 */
export default async (req: NextApiRequest, res: NextApiResponse) => {
    // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
    const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
    const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;
    const STORAGE_TABLE_NAME = process.env.STORAGE_TABLE_NAME;

    // Load the required libraries for Azure Table access
    const { AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

    // Create the Azure Table Client
    const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
    const tableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, STORAGE_TABLE_NAME, tableCredential);

    const customer = await stripe.customers.create({
        name: 'jenny rosen',
        email: 'jenny.rosen@example.com',
        description: 'My first test customer',
    });

    // Create the entry to put in the table
    // 
    // NOTE: I use the "Account*" as the partitionKey and "User*" as 
    //       the rowKey (which are the only requireed fields). This is 
    //       because all entries with the same partitionKey are to be 
    //       served by the same partition server where rowKey is 
    //       intended to identifiy a single row (or the combination of 
    //       the parititionKy and rowKey is)
    //       
    //       See: https://docs.microsoft.com/en-us/rest/api/storageservices/designing-a-scalable-partitioning-strategy-for-azure-table-storage
    const testEntity = {
        partitionKey: "Account1",
        rowKey: "User1",
        stripeCustomerId: customer.id,
        approver: "a.bridgeman@hotmail.com"
    };
    
    // Put the entry in the table
    const result = await tableClient.createEntity(testEntity);
    
    res.status(200).json({ userId: result.id })
}