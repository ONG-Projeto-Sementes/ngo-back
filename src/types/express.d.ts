import { IUser } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      identity?: IUser;
    }
  }
}
