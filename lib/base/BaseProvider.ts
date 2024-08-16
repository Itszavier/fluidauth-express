/** @format */

import { Request, Response, NextFunction } from "express";
import { ErrorNames, FluidAuthError } from "../core/Error";
import { CreateSessionFunction } from "..";

export type DoneFunction = (
  err?: Error | null,
  user?: Express.User,
  info?: { statusCode?: number; message?: string; name?: string } | null
) => void;

/** @format */
type BaseProviderConfig =
  | {
      type: "Credentials";
      name: string;
    }
  | {
      type: "OAuth2";
      name: string;
    };

export class BaseProvider {
  config: BaseProviderConfig;
  createSession!: CreateSessionFunction;

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  done: DoneFunction = (err, user, info) => {
    if (err) {
      throw err;
    }

    if (!user) {
      throw new FluidAuthError({
        name: ErrorNames.UnauthorizedError,
        message: info?.message || "Unauthorized",
        code: info?.statusCode || 401,
      });
    }

    return user;
  };

  async ExchangeCodeForToken(code: string) {}

  // Example method to demonstrate type narrowing
  authenticate(req: Request, res: Response, next: NextFunction) {}
}
