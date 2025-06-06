import { isAuthenticated } from '../middlewares/index.js';
import { register, login, isAuthenticatedHandler, logout } from '../controllers/authentication.js';
export default (router) => {
    router.post('/auth/register', register);
    router.post('/auth/login', login);
    router.get('/auth/isAuthenticated', isAuthenticated, isAuthenticatedHandler);
    router.post('/auth/logout', logout);
};
