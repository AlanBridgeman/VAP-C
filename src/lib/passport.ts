import passport from 'passport'
import * as Local from 'passport-local';
import { User as UserModel } from '../types/User';
import { findUserByUID, validatePassword } from './db'

declare global {
  namespace Express {
    interface User extends UserModel { }
  }
}

/**
 * Serialize the user into the session
 * Part of setup for passport.initialize() and passport.session()
 */
passport.serializeUser(function (user, done) {
    console.log('Serializing User: ' + user[0]);
    // serialize the username into session
    done(null, user.id)
});

/**
 * Deserilize the user from the session
 * Part of setup for passport.initialize()
 */
passport.deserializeUser(
    async (user: UserModel, done) => {
        console.log('Deserializing: ' + JSON.stringify(user))
        try {
            findUserByUID(user.id, function(err, user) {
                done(err, user);
            });
        }
        catch(err) {
          done(err, null)
        }
    }
);

const verify = async (uid, password, done) => {
    // Here you lookup the user in your DB and compare the password/hashed password
    await findUserByUID(uid, function(err, user) {
        // Security-wise, if you hashed the password earlier, you must verify it
        // if (!user || await argon2.verify(user.password, password))
        if (!user || !validatePassword(user, password)) {
            done(err, null)
        }
        else {
            done(err, user)
        }
    });
};

passport.use(
  new Local.Strategy(
    { passReqToCallback: true },
    verify
  )
)

export default passport
