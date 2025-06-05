import { get, merge } from 'lodash-es';
import { getUserBySessionToken } from '../db/users.js';
export const isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = get(req, 'identity._id');
        if (!currentUserId) {
            res.sendStatus(403);
            return;
        }
        if (currentUserId.toString() !== id.toString()) {
            res.sendStatus(403);
            return;
        }
        next();
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
export const isAuthenticated = async (req, res, next) => {
    try {
        const sessionToken = req.cookies['sessionToken'];
        if (!sessionToken) {
            res.sendStatus(403);
            return;
        }
        // Garanta que o campo sessionToken seja retornado, pois no schema ele está com select: false
        const existingUser = await getUserBySessionToken(sessionToken).select('+authentication.sessionToken');
        if (!existingUser) {
            res.sendStatus(403);
            return;
        }
        merge(req, { identity: existingUser });
        next();
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
