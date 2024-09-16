/** @format */

import { Request, Response, NextFunction } from "express";
import { ErrorName, FluidAuthError } from "../core/Error";
import { IAuthResponse, TRedirectFunction, TRedirectType, TShouldRedirectFunction } from "./types";

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
  shouldRedirect!: TShouldRedirectFunction;
  redirect!: TRedirectFunction;

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  performRedirect(response: Response, type: TRedirectType, success: boolean = true): void {
    if (this.shouldRedirect(type)) {
      this.redirect(response, type, success);
    }
  }

  async handleRedirectUri(req: Request, res: Response, next: NextFunction) {
    console.warn(`${this.config.name} Provider redirect uri handler function not implemented`);
    next();
  }

  async processVerificationResult(verifyFunction: () => Promise<IAuthResponse> | IAuthResponse) {
    try {
      let results = verifyFunction();

      if (results instanceof Promise) {
        results = await results;
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Example method to demonstrate type narrowing
  authenticate(req: Request, res: Response, next: NextFunction) {}

  handleFailureRedirect(res: Response) {
    if (this.shouldRedirect("login")) {
      this.redirect(res, "login", true);
    }
  }

  async handleLogin(req: Request, res: Response, fn: () => Promise<IAuthResponse> | IAuthResponse) {
    try {
      const { user, info } = await this.processVerificationResult(fn);

      if (!user) {
        return res
          .status(info?.code || 401)
          .json({ name: info?.name || "FluidAuthSoftError", message: info?.message || "Unauthorized" });
      }

      await req.session.create(user);

      if (this.shouldRedirect("login")) {
        return this.redirect(res, "login", true);
      }

      res.status(200).json({
        message: "successfully logged in",
      });
    } catch (error) {
      if (this.shouldRedirect("login")) {
        return this.redirect(res, "login", true);
      }
      throw error;
    }
  }
}
