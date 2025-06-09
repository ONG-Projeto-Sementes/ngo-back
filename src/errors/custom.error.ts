export class CustomError extends Error {
    code: number;
    constructor(code: number, name: string, message: string) {
        super(message);
        this.name = name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}