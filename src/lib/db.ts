
import crypto from 'crypto'
import { v4 as newUUID } from 'uuid'
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables'
import Prisma from '../lib/prisma';
import { Account, User } from 'prisma';
import { User as SessionUser } from '../types/User';

/**
 * Get all the users associated with the given account
 * 
 * @param name 
 * @returns User[] 
 */
export async function getUsersInAccount(id: number): Promise<User[]> {
  const account = await Prisma.account.findUnique(
    {
      select: {
        users: true
      },
      where: {
        id: id
      }
    }
  )

  return account.users;
}

export async function createUser(req, { accountName, password, email, ...props }) {
  // Here you should create the user and save the salt and hashed password 
  // (some dbs may have authentication methods that will do it for you so 
  // you don't have to worry about it):
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex')
  
  // In theory the following two steps could be combined in Prisma but... 
  // just getting it to work for now
  const account: Account = {
    name: accountName
  };

  const newAccount: Account = await Prisma.account.create({ data: account })

  const user: User = {
    email: email,
    password: hash,
    salt: salt,
    aId: newAccount.id
  }

  const newUser: SessionUser = await Prisma.user.create({data: user})

  // Needed Azure Table Storage (part of Azure Storage Account) credentials loaded from environment variables (for security)
  const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
  const STORAGE_ACCOUNT_KEY = process.env.STORAGE_ACCOUNT_KEY;

  const table_name = 'userProps';

  // Create the Azure Table Client
  const tableCredential = new AzureNamedKeyCredential(STORAGE_ACCOUNT_NAME, STORAGE_ACCOUNT_KEY);
  const tableClient = new TableClient(`https://${STORAGE_ACCOUNT_NAME}.table.core.windows.net`, table_name, tableCredential);
  
  console.log(props.toString());

  /*for (let prop in props) {
    if(prop)
  }*/

  // Create the entry to put in the table
  // 
  // NOTE: I use the "Account ID" as the partitionKey and "User ID" as 
  //       the rowKey (which are the only requireed fields). This is 
  //       because all entries with the same partitionKey are to be 
  //       served by the same partition server where rowKey is 
  //       intended to identifiy a single row (or the combination of 
  //       the parititionKy and rowKey is)
  //       
  //       See: https://docs.microsoft.com/en-us/rest/api/storageservices/designing-a-scalable-partitioning-strategy-for-azure-table-storage
  const testEntity = {
      partitionKey: newUser.aId.toString(),
      rowKey: newUser.id.toString(),
      fname: "Alan",
      lname: "Bridgeman"
  };
  
  // Put the entry in the table
  await tableClient.createEntity(testEntity);

  // Insert the user into the session
  // I'm not entirely sure it's neccessary to do this, this way 
  // but it's working and seems good enough for now.
  req.session.passport = { user: newUser };

  console.log('Set req.session.user to ' + req.session.passport.user);
}

/**
 * Here you find the account in the dabase by name
 */
export async function findAccountByName(name) {
  const account = await Prisma.account.findUnique(
    {
      where: {
        name: name
      }
    }
  );

  return account;
}

/**
 * Here you find the account in the dabase by name
 */
 export async function findUserByUID(id, callback: (err: any, user?: User) => void) {
  try {
    const user = await Prisma.user.findUnique(
      {
        where: {
          id: id
        }
      }
    );

    callback(null, user);
  }
  catch(e) {
    callback(e, null)
  }
}

/**
 * Here you find the account in the dabase by name
 */
 export async function findUserByEmail(email, callback: (err: any, user?: SessionUser) => void) {
  try {
    const user: SessionUser = await Prisma.user.findUnique(
      {
        select: {
          id: true,
          email: true,
          aId: true
        },
        where: {
          email: email
        }
      }
    );

    callback(null, user);
  }
  catch(e) {
    callback(e, null)
  }
}

export function updateUserByUsername(req, username, update) {
  // Here you update the user based on id/username in the database
  // const user = await db.updateUserById(id, update)
  const user = req.session.users.find((u) => u.username === username)
  Object.assign(user, update)
  return user
}

export function deleteUser(req, username) {
  // Here you should delete the user in the database
  // await db.deleteUser(req.user)
  req.session.users = req.session.users.filter(
    (user) => user.username !== req.user.username
  )
}

/**
 * Compare the password of a user and compare and a string provided as a 
 * potential match
 */
export async function validatePassword(email, inputPassword) {
  // Get the user from the datbase because we don't store the password 
  // locally
  const db_user: User = await Prisma.user.findUnique(
    {
      where: {
        email: email
      }
    }
  );
  
  // Generate the string to compare the password to this is because the 
  // password is salted (a bunch of random bits are appended at the end 
  // to improve randomness) and then encrypted for security. Also, keep in 
  // mind encryption is purposefully one-way which means we can only 
  // encrypt whats provided as a potential match and then compare. 
  const inputHash = crypto
    .pbkdf2Sync(inputPassword, db_user.salt, 1000, 64, 'sha512')
    .toString('hex')
  
  // Check if the generated string matches what we got from the database
  const passwordsMatch = db_user.password === inputHash

  // return the result of the comparison
  return passwordsMatch
}
