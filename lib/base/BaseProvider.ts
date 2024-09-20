/** @format */
import qs from "querystring";
import { Request, Response, NextFunction } from "express";
import { ErrorName, FluidAuthError } from "../core/Error";
import {
  IValidationResponse,
  TRedirectFunction,
  TRedirectType,
  TShouldRedirectFunction,
  ValidationFunctionReturnType,
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

export interface IHttpContext {
  req: Request;
  res: Response;
  next: NextFunction;
}

export interface IHandleAuthErrorConfig {
  context: IHttpContext;
  message?: string;
}

interface IHandleLoginConfig {
  context: IHttpContext;
  validationFunction: () => ValidationFunctionReturnType;
}

export interface IBaseProviderLocal {
  redirect: IRedirectConfig;
}

async function resolveVerificationResult(validationFunction: () => ValidationFunctionReturnType) {
  try {
    let results = validationFunction();

    if (results instanceof Promise) {
      results = await results;
    }

    return results;
  } catch (error) {
    throw error;
  }
}

export class BaseProvider {
  config: BaseProviderConfig;
  shouldRedirect!: TShouldRedirectFunction;
  redirect!: TRedirectFunction;
  _local!: IBaseProviderLocal;

  constructor(config: BaseProviderConfig) {
    this.config = config;
  }

  /**
   *
   * @deprecated this helper function should know longer be used
   */
  performRedirect(response: Response, type: TRedirectType, success: boolean = true): void {
    if (this.shouldRedirect(type)) {
      this.redirect(response, type, success);
    }
  }

  public authenticate(req: Request, res: Response, next: NextFunction) {}

  public async handleCallback(req: Request, res: Response, next: NextFunction) {
    next();
  }

  protected async handleLogin(config: IHandleLoginConfig) {
    // Validate required config properties

    const context = config.context || {};
    const validateUserFunction = config.validationFunction;

    if (!context.req || !context.res) {
      throw new Error("Request and Response objects must be provided.");
    }

    const { req, res } = context;
    const local = this._local;

    try {
      const { user, info } = await resolveVerificationResult(validateUserFunction);

      if (!user) {
        return this.handleAuthError({
          context,
          message: info?.message || "UnAuthorized",
        });
      }

      if (!context.next || typeof context.next !== "function") {
        throw new Error("Next function must be provided and should be a function.");
      }

      await req.session.create(user);

      if (local.redirect.onLoginSuccess) {
        return res.redirect(local.redirect.onLoginSuccess);
      }

      res.status(200).json({
        message: "Logged in",
      });
    } catch (error) {
      if (error instanceof Error) {
        this.handleAuthError({ context, message: error.message });
        return;
      }
      context.next(error);
    }
  }

  protected handleAuthError(config: IHandleAuthErrorConfig) {
    // Check if the required config properties are provided

    const context = config.context || {};

    if (!context.req) {
      throw new Error("Request object must be provided.");
    }

    if (!context.res) {
      throw new Error("Response object must be provided.");
    }

    if (!context.next || typeof context.next !== "function") {
      throw new Error("Next function must be provided and should be a function.");
    }

    // Destructure the request and response from the config
    const { req, res } = context;

    const local = this._local;

    // Default error message if none is provided
    const message =
      config.message ||
      "Something went wrong during the provider part of the authentication flow. The creator of this provider did not specify a descriptive error message.";

    // Handle failure redirect if configured in AuthService
    if (local.redirect && local.redirect.onLoginFailure) {
      const url = local.redirect.onLoginFailure;
      const query = qs.stringify({ message: encodeURIComponent(message) });
      res.redirect(`${url}?${query}`);
      return;
    }

    // If no redirect is configured, respond with JSON error message
    res.status(400).json({
      message,
    });
  }
}
