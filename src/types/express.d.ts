import { UserDocument } from '../db/users';

declare global {
  namespace Express {
    interface Request {
      identity?: UserDocument;
    }
  }
}
