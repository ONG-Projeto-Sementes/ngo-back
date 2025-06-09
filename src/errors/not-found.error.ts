import { CustomError } from "./custom.error.js";

export class NotFoundError extends CustomError {
    constructor(code: string, message: string) {
        super(404, code, message);
    }
}
