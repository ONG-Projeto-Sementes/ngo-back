import { CustomError } from "./custom.error.js";

export class ConflictError extends CustomError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}
