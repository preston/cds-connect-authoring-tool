import express from 'express';
import auth from '../handlers/authHandler.js';

const AuthRouter = express.Router();

AuthRouter.route('/login').post(auth.login);

AuthRouter.route('/logout').get(auth.logout);

AuthRouter.route('/user').get(auth.currentUser);

export default AuthRouter;
