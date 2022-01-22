import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import nextConnect from 'next-connect';
import auth from '../../middleware/auth';
import { deleteUser, createUser, updateUserByUsername } from '../../lib/db';
import { User } from '../../types/User';
import Passport from '../../lib/passport';

interface ExtendedRequest extends NextApiRequest {
  user?: User,
  logIn(): any
  logOut(): any
}

const handler = nextConnect<ExtendedRequest, NextApiResponse>()

handler
  .use(auth)
  .get(
    async (req: ExtendedRequest, res: NextApiResponse) => {
      //console.log('Session Data: ' + JSON.stringify(req.session));

      await Passport.authenticate('local');
      
      //console.log('User Data: ' + JSON.stringify(req.user));

      // You do not generally want to return the whole user object
      // because it may contain sensitive field such as !!password!! Only return what needed
      // const { name, username, favoriteColor } = req.user
      // res.json({ user: { name, username, favoriteColor } })
      res.json({ user: req.user })
    }
  )
  .post(
    (req: ExtendedRequest, res: NextApiResponse) => {
      const { accountName, password, email } = req.body
      createUser(req, { accountName, password, email })
      res.status(200).json({ success: true, message: 'created new user' })
    }
  )
  /*.use(
    (req: ExtendedRequest, res: NextApiResponse, next: NextApiHandler) => {
      // handlers after this (PUT, DELETE) all require an authenticated user
      // This middleware to check if user is authenticated before continuing
      if (!req.user) {
        res.status(401).send('unauthenticated')
      }
      else {
        next(req, res)
      }
    }
  )
  .put(
    (req: ExtendedRequest, res: NextApiResponse) => {
      const { name } = req.body
      const user = updateUserByUsername(req, req.user.username, { name })
      res.json({ user })
    }
  )
  .delete(
    (req: ExtendedRequest, res: NextApiResponse) => {
      deleteUser(req, "")
      req.logOut()
      res.status(204).end()
    }
  )*/

export default handler
