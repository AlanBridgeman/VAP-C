/*
*************************************************************
* Name: db-adapter.ts (Generic database adapter)
* Description: Provide a standardized interface to interact 
*              with the database that way abstracting away 
*              from the underlying library used to connect 
*              to and do manipulations to the database
* Author: Alan Bridgeman
* Created: April, 2nd 2022
*************************************************************
*/

import { User } from '../../types/User';
import { Account } from '../../types/Account';

export default interface DBAdapter {
    /**
     * Get all the users associated with the given account
     * 
     * @param id (string) - The id of the account to get the users for
     * @returns User[] - The list of users (in internal user representation format)
     */
    getUsersInAccount(id: string): Promise<User[]>;
    
    /**
     * Save an internal Account object into the database as transparently as possible (that is making as little 
     * changes as possible).
     *
     * @param account (Account) - The internal representation of the account to 
     *                            create in the database
     * @returns Account - The internal representation having been saved to the 
     *                    database
     */
    saveAccountToDB(account: Account): Promise<Account>;
    
    /**
     * Saves the internal user representation to the database.
     * 
     * It's important to note this DOESN'T save the User's properties (
     * NoSQL record) but rather simply copies them this is important 
     * because these are stored and retrieved seperately and by decoupling 
     * the two it means things like order or timing of the retrival and 
     * other operations is removed or lessened from consideration.
     * 
     * @param user (User) - The internal representation of the user to be added to the database
     * @param password (string) - Note, that because we want to avoid passwords 
     *                            locally as much as possible we don't have a 
     *                            password property on the internal user 
     *                            representation which means we have to pass 
     *                            this seperately
     * @returns User - The internal user representation of the user added to the database
     */
    saveUserToDB(user: User, password: string): Promise<User>;
    
    /**
     * Attempt to find the account in the database by the name provided
     * 
     * @param name (string) - The name of the account to find in the database
     * @return Account - The internal representation of the account found in the database
     */
    findAccountByName(name: string): Promise<Account>;
    
    /**
     * Find the user in the dabase by User ID
     * 
     * @param id (string) - The ID of the user to get from the database
     * @param callback (Function(error: any, user: User|null)) - The callback to call with the results
     * 
     * @return N/A (void) - Uses a callback instead
     */
    findUserByUID(id: string, callback: (err: any, user?: User) => void): Promise<void>;
    
    /**
     * Find the user in the dabase by email
     * 
     * @param email (string) - The email of the user to find
     * @param callback (Function(error: any, user: User|null)) - The callback to call
     * @return N/A (void) - Uses a callback instead
     */
    findUserByEmail(email: string, callback: (err: any, user?: User) => void): Promise<void>;
    
    /**
     * Update the user
     * 
     * @param email (string) - The email of the user to be updated
     * @param data (any) - The data to be updated in the database
     * @returns User - The internal representation of the updated user
     */
    updateUserByEmail(email: string, data): Promise<User>;
    
    /**
     * Delete the user from the database
     * 
     * @param id (string) - The ID of the user to be deleted from the database
     */
    deleteUser(id: string);
    
    /**
     * Compare the password of a user and compare and a string provided as a 
     * potential match
     */
    validatePassword(email, inputPassword);

    /**
     * List the services
     */
    listServices();
}