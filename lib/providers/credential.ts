/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";
import { ErrorName, FluidAuthError } from "../core/Error";
import { VerifyUserFunctionReturnType } from "../base";

interface ICredentialProviderConfig {
  verifyUser: (email: string, password: string) => VerifyUserFunctionReturnType; // Use Promise for async operations
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

    console.log("Email & Password:", email, password);

    if (!email || !password) {
      const missingField = !email ? "email" : "password";
      return next(
        new Error(`[CredentialProvider]: ${missingField} is required`)
      );
    }

    if (!this.providerConfig) {
      return next(
        new FluidAuthError({
          name: ErrorName.BadRequestError,
          message: "config not specified",
        })
      );
    }

    try {
      const verifyFunction = this.providerConfig.verifyUser.bind(
        null,
        email,
        password
      );
      await this.handleLogin(req, res, verifyFunction);
    } catch (error) {
      return next(error); // Pass any errors that occurred during verification
    }
  }
}
