import express from 'express';

import { isAuthenticated } from '../middlewares/index.js';
import { register, login, isAuthenticatedHandler } from '../controllers/authentication.js';

export default (router: express.Router) => {
  router.post('/auth/register', register);
  router.post('/auth/login', login);
  router.get('/auth/isAuthenticated', isAuthenticated, isAuthenticatedHandler);
};
