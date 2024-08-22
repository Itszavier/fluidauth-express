/** @format */

import { Request, Response, NextFunction } from "express";
import { ErrorName, FluidAuthError } from "../core/Error";
import { CreateSessionFunction } from "..";

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

export interface IValidationData {
  info?: Error | { message?: string; code?: number } | null;
  error?: Error | null;
  user?: Express.User | null;
}

export class BaseProvider {
  config: BaseProviderConfig;
  loginUser!: CreateSessionFunction;

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  async handleRedirectUri(req: Request, res: Response, next: NextFunction) {
    console.warn(
      `${this.config.name} Provider redirect uri handler function not implemented`
    );
    next();
  }

  validateInfo(data: IValidationData): Express.User {
    if (!data.user && data.info) {
      if (data.info instanceof Error) {
        throw data.info;
      }

      throw new FluidAuthError({
        message: data.info.message || "Unauthorized",
        code: data.info.code || 401,
      });
    }

    if (data.error && data.error instanceof Error) {
      throw data.error;
    }

    if (!data.user) {
      throw new FluidAuthError({
        message: "Unauthorized: Verify did not return a user",
      });
    }

    return data.user;
  }

  // Example method to demonstrate type narrowing
  authenticate(req: Request, res: Response, next: NextFunction) {}
}
