/** @format */

import { Request, Response, NextFunction } from "express";
import { ErrorNames, FluidAuthError } from "../core/Error";
import { CreateSessionFunction } from "..";
import { DoneFunction } from "./types";

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
        code: info?.code || 401,
      });
    }

    return user;
  };

  async handleRedirectUri(req: Request, res: Response, next: NextFunction) {
    console.warn(
      `${this.config.name} Provider redirect uri handler function not implemented`
    );
    next();
  }

  // Example method to demonstrate type narrowing
  authenticate(req: Request, res: Response, next: NextFunction) {}
}
