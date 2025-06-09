import { CustomError } from "./custom.error.js";

export class UnauthorizedError extends CustomError {
    constructor(code: string, message: string) {
        super(401, code, message);
    }
}
