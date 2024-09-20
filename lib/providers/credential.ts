/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";
import { ErrorName, FluidAuthError } from "../core/Error";
import { ValidationFunctionReturnType } from "../base";

interface ICredentialProviderConfig {
  validateUser: (
    email: string,
    password: string
  ) => ValidationFunctionReturnType; // Use Promise for async operations
}

export class CredentialProvider extends BaseProvider {
  providerConfig: ICredentialProviderConfig;

  constructor(config: ICredentialProviderConfig) {
    super({ type: "Credentials", name: "credential" });

    this.providerConfig = config;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const { email, password }: { email: string; password: string } =
      req.body || {};

    if (!email || !password) {
      this.handleAuthError({
        context: { req, res, next },
        message: "email & password fields are missing ",
      });
      return;
    }

    try {
      const { validateUser } = this.providerConfig;
      const validationFunction = validateUser.bind(null, email, password);

      await this.handleLogin({
        context: { req, res, next },
        validationFunction,
      });
    } catch (error) {
      return next(error); // Pass any errors that occurred during verification
    }
  }
}
