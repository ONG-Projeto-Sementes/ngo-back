import express from 'express';

import users from './users.js';
import health from './health.js';
import authentication from './authentication.js';

const router = express.Router();

export default (): express.Router => {
  authentication(router);
  health(router);
  users(router);

  return router;
};
