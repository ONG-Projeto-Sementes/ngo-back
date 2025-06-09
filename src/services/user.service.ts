import { BaseService } from "../core/base-service/index.js";
import { IUser, UserModel } from "../db/users.js";
import { random, authentication } from "../helpers/index.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { BadRequestError } from "../errors/bad-request.error.js";

export class UserService extends BaseService<IUser> {
  constructor() {
    super(UserModel);
  }

  async authenticateUser(
    email: string,
    password: string,
  ): Promise<IUser | null> {
    const user = await this.findOne({
      filters: { email },
      select:
        "+authentication.salt +authentication.password +authentication.sessionToken",
    });

    if (!user || !user.authentication?.salt || !user.authentication?.password) {
      throw new NotFoundError("user_not_found", "Usuário não encontrado");
    }

    const expectedHash = authentication(user.authentication.salt, password);
    if (user.authentication.password !== expectedHash) {
      throw new BadRequestError("invalid_credentials", "Credenciais inválidas");
    }

    user.authentication.sessionToken = random();
    await this.updateOne(user._id, {
      authentication: user.authentication,
    });

    return user;
  }

  async registerUser(userData: {
    email: string;
    password: string;
    username: string;
  }): Promise<IUser | null> {
    const { email, password, username } = userData;

    const existingUser = await this.findOne({
      filters: { email },
    });
    if (existingUser) {
      throw new NotFoundError("user_already_exists", "Usuário já existe");
    }

    const salt = random();
    return this.insert({
      email,
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });
  }
}

export default new UserService();
