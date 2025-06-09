import { CustomError } from "./custom.error.js";

export class ServerError extends CustomError {
    constructor(code: string, message: string) {
        super(500, code, message);
    }
}
