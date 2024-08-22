/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider, IValidationData } from "../base/BaseProvider";
import { ErrorName, FluidAuthError } from "../core/Error";

interface ICredentialProviderConfig {
  verify: (email: string, password: string) => Promise<IValidationData>; // Use Promise for async operations
}

export class CredentialProvider extends BaseProvider {
  credentialConfig: ICredentialProviderConfig;

  constructor(config: ICredentialProviderConfig) {
    super({ type: "Credentials", name: "credential" });
    this.credentialConfig = config;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const { email, password }: { email: string; password: string } =
      req.body || {};

    console.log("Email", email, "password", password);

    // Check for missing credentials
    if (!email || !password) {
      const missingField = !email ? "email" : "password";
      return next(
        new Error(`[CredentialProvider]: ${missingField} is required`)
      );
    }

    // Ensure credentialConfig is defined
    if (!this.credentialConfig) {
      return next(
        new FluidAuthError({
          name: ErrorName.BadRequestError,
          message: "config not specified",
        })
      );
    }

    try {
      const validationInfo = await this.credentialConfig.verify(
        email,
        password
      );
      const user = this.validateInfo(validationInfo);

      await this.loginUser(req, res, user);

      next();
    } catch (error) {
      return next(error); // Pass any errors that occurred during verification
    }
  }
}
