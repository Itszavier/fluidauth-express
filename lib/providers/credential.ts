/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider, IValidationData } from "../base/BaseProvider";
import { ErrorName, FluidAuthError } from "../core/Error";

interface ICredentialProviderConfig {
  verifyUser: (email: string, password: string) => Promise<IValidationData>; // Use Promise for async operations
}

export class CredentialProvider extends BaseProvider {
  credentialConfig: ICredentialProviderConfig;

  constructor(config: ICredentialProviderConfig) {
    super({ type: "Credentials", name: "credential" });
    this.credentialConfig = config;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const { email, password }: { email: string; password: string } = req.body || {};

    if (!email || !password) {
      const missingField = !email ? "email" : "password";
      return next(new Error(`[CredentialProvider]: ${missingField} is required`));
    }

    if (!this.credentialConfig) {
      return next(
        new FluidAuthError({
          name: ErrorName.BadRequestError,
          message: "config not specified",
        })
      );
    }

    try {
      const validationInfo = await this.credentialConfig.verifyUser(email, password);
      const user = this.validateInfo(validationInfo);

      await req.session.create(user);

      next();
    } catch (error) {
      return next(error); // Pass any errors that occurred during verification
    }
  }
}
