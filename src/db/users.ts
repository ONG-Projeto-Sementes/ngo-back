import mongoose from "mongoose";
import { BaseInterface } from "../types/base-interface.js";

export interface IUser extends BaseInterface {
  username: string;
  email: string;
  authentication: {
    password: string;
    salt: string;
    sessionToken?: string;
  }
}

const UserSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    authentication: {
        password: { type: String, required: true, select: false },
        salt: { type: String, select: false },
        sessionToken: { type: String, select: false }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model('User', UserSchema);
