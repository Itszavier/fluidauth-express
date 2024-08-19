/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";
import { ErrorNames, FluidAuthError } from "../core/Error";
import { CreateSessionFunction } from "..";
import { DoneFunction } from "../base/types";

interface ICredentialProviderConfig {
  verify: (email: string, password: string, done: DoneFunction) => Promise<any>; // Use Promise for async operations
}

export class CredentialProvider extends BaseProvider {
  credentialConfig: ICredentialProviderConfig;

  constructor(config: ICredentialProviderConfig) {
    super({ type: "Credentials", name: "credential" });
    this.credentialConfig = config;
  }

  async authenticate(req: Request, res: Response, next: NextFunction) {
    const { email, password }: { email: string; password: string } = req.body || {};

    console.log("Email", email, "password", password);

    // Check for missing credentials
    if (!email || !password) {
      const missingField = !email ? "email" : "password";
      return next(new Error(`[CredentialProvider]: ${missingField} is required`));
    }

    // Ensure credentialConfig is defined
    if (!this.credentialConfig) {
      return next(
        new FluidAuthError({
          name: ErrorNames.BadRequestError,
          message: "config not specified",
        })
      );
    }

    try {
      // Call the verify function with email, password, and done function
      await this.credentialConfig.verify(email, password, async (err, user, info) => {
        if (err) {
          return next(err); // Pass the error to the next middleware
        }

        if (!user) {
          // Use info parameter to provide additional details
          const message = info?.message || "[CredentialProvider]: Authentication failed";
          return next(new Error(message));
        }

        // Attach the authenticated user to the request object
        try {
          await this.createSession(req, res, user);
          return next();
        } catch (error) {
          next(error);
        }
      });
    } catch (error) {
      return next(error); // Pass any errors that occurred during verification
    }
  }
}
