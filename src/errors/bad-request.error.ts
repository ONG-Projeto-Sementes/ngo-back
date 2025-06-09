import { CustomError } from "./custom.error.js";

export class BadRequestError extends CustomError {
    constructor(code: string, message: string) {
        super(400, code, message);
    }
}
