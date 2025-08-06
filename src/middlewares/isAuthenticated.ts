import express from "express";
import { merge } from "lodash-es";
import UserService from "../services/user.service.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

export const isAuthenticated = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    const sessionToken = req.cookies["sessionToken"];
    
    console.log("🍪 Cookies received:", req.cookies);
    console.log("🔑 Session token:", sessionToken);

    if (!sessionToken) {
      console.log("❌ No session token found in cookies");
      throw new UnauthorizedError("unauthenticated", "Sem sessão ativa");
    }

    const existingUser = await UserService.findOne({
      select: "+authentication.sessionToken",
      filters: {
        "authentication.sessionToken": sessionToken,
      },
    });

    if (!existingUser) {
      console.log("❌ User not found for session token");
      throw new UnauthorizedError("unauthenticated", "Sessão não encontrada");
    }

    console.log("✅ User authenticated:", existingUser.username);
    merge(req, { identity: existingUser });

    next();
  } catch (error) {
    console.log("🚨 Authentication error:", error);
    next(error);
  }
};
