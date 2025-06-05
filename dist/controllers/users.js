import { deleteUserById, getUserById, getUsers } from '../db/users.js';
export const getAllUsers = async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await deleteUserById(id);
        res.status(200).json(deletedUser);
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username } = req.body;
        if (!username) {
            res.sendStatus(400);
            return;
        }
        const user = await getUserById(id);
        if (!user) {
            res.sendStatus(404);
            return;
        }
        user.username = username;
        await user.save();
        res.status(200).json(user);
        return;
    }
    catch (error) {
        console.log(error);
        res.sendStatus(400);
        return;
    }
};
