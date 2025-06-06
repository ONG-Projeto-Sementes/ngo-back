import { random, authentication } from '../helpers/index.js';
import { createUsers, getUserByEmail } from '../db/users.js';
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.sendStatus(400);
            return;
        }
        const user = await getUserByEmail(email).select('+authentication.salt +authentication.password +authentication.sessionToken');
        if (!user || !user.authentication?.salt || !user.authentication?.password) {
            res.sendStatus(400);
            return;
        }
        const expectedHash = authentication(user.authentication.salt, password);
        if (user.authentication.password !== expectedHash) {
            res.sendStatus(403);
            return;
        }
        const salt = random();
        user.authentication.sessionToken = authentication(salt, user._id.toString());
        await user.save();
        res.cookie('sessionToken', user.authentication.sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
        res.status(200).json(user);
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
export const register = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            res.sendStatus(400);
            return;
        }
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            res.sendStatus(400);
            return;
        }
        const salt = random();
        const newUser = await createUsers({
            email,
            username,
            authentication: {
                salt,
                password: authentication(salt, password),
            },
        });
        res.status(200).json(newUser);
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
export const isAuthenticatedHandler = (req, res) => {
    const user = req.identity;
    if (!user) {
        res.sendStatus(403);
        return;
    }
    res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
    });
};
export const logout = (req, res) => {
    res.clearCookie('sessionToken', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    });
    res.sendStatus(200);
    return;
};
