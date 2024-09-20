/** @format */
import qs from "querystring";
import { Request, Response, NextFunction } from "express";
import { ErrorName, FluidAuthError } from "../core/Error";
import {
  IAuthResponse,
  TRedirectFunction,
  TRedirectType,
  TShouldRedirectFunction,
} from "./types";
import { IRedirectConfig } from "../core";

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

interface IHandleAuthErrorConfig {
  req: Request;
  res: Response;
  next: NextFunction;
  message?: string;
}

export interface IBaseProviderLocal {
  redirect: IRedirectConfig;
}

export class BaseProvider {
  config: BaseProviderConfig;
  shouldRedirect!: TShouldRedirectFunction;
  redirect!: TRedirectFunction;
  _local!: IBaseProviderLocal;

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  performRedirect(
    response: Response,
    type: TRedirectType,
    success: boolean = true
  ): void {
    if (this.shouldRedirect(type)) {
      this.redirect(response, type, success);
    }
  }

  async handleRedirectUri(req: Request, res: Response, next: NextFunction) {
    console.warn(
      `${this.config.name} Provider redirect uri handler function not implemented`
    );
    next();
  }

  async processVerificationResult(
    verifyFunction: () => Promise<IAuthResponse> | IAuthResponse
  ) {
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

  async handleLogin(
    req: Request,
    res: Response,
    fn: () => Promise<IAuthResponse> | IAuthResponse
  ) {
    try {
      const { user, info } = await this.processVerificationResult(fn);

      if (!user) {
        return res.status(info?.code || 401).json({
          name: info?.name || "FluidAuthSoftError",
          message: info?.message || "Unauthorized",
        });
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

  handleAuthError(config: IHandleAuthErrorConfig) {
    // Check if the required config properties are provided
    if (!config.req) {
      throw new Error("Request object must be provided.");
    }

    if (!config.res) {
      throw new Error("Response object must be provided.");
    }

    if (!config.next || typeof config.next !== "function") {
      throw new Error(
        "Next function must be provided and should be a function."
      );
    }

    // Destructure the request and response from the config
    const { req, res } = config;
    const local = this._local;

    // Default error message if none is provided
    const message =
      config.message ||
      "Something went wrong during the provider part of the authentication flow. The creator of this provider did not specify a descriptive error message.";

    // Handle failure redirect if configured in AuthService
    if (local.redirect && local.redirect.onLoginFailure) {
      const url = local.redirect.onLoginFailure;
      const query = qs.stringify({ message });
      res.redirect(`${url}?${query}`);
      return;
    }

    // If no redirect is configured, respond with JSON error message
    res.status(400).json({
      message,
    });
  }
}
