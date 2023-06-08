import { NextApiRequest, NextApiResponse } from 'next';
import { AzureNamedKeyCredential, TableClient } from '@azure/data-tables';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
    const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
    const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;
    const STORAGE_TABLE_NAME = process.env.STORAGE_TABLE_NAME;

    // Create the Azure Table Client
    const tableUrl = `https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`;
    const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
    const tableClient = new TableClient(tableUrl, STORAGE_TABLE_NAME, tableCredential);
    
    const entity = {
        partitionKey: "Stationery",
        rowKey: "A1",
        name: "Marker Set",
        price: 5.0,
        brand: "myCompany"
    };
    
    // Entity doesn't exist in table, so calling upsertEntity will simply insert the entity.
    await tableClient.upsertEntity(entity, "Merge");

    // Entity does exist in the table, so calling upsertEntity will update using the given UpdateMode.
    // Because we are passing "Replace" as update mode, the existing entity will be replaced and delete the "brand" property.
    await tableClient.upsertEntity(
        {
            partitionKey: "Stationery",
            rowKey: "A1",
            name: "Marker Set",
            price: 5.0,
            // Replace with the same entity but without a brand
            brand: undefined
        },
        "Replace"
    );
    
    // Getting the entity we just created should give us an entity similar to the one that we first inserted
    // but without a brand property
    const noBrandEntity = await tableClient.getEntity(entity.partitionKey, entity.rowKey);

    // Now we update the price setting, the default update mode is "Merge" which will only update the properties
    // of the entity that are different to what is already stored, in this case we just need to update the price
    // so we can just send an entity with the partition and row keys plus the new price
    await tableClient.updateEntity(
        {
            partitionKey: noBrandEntity.partitionKey,
            rowKey: noBrandEntity.rowKey,
            price: 7.0
        }
    );
}