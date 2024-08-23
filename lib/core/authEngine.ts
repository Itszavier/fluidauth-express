/** @format */

import type { Response, Request, NextFunction } from "express";
import { Session, ISessionConfig } from "./session";
import { BaseProvider } from "../base/BaseProvider";
import { encrypt } from "../utils/dev";
import { ErrorName, FluidAuthError } from "../core/Error";

export interface IAuthEngineConfig {
  providers: BaseProvider[];
  session: ISessionConfig;
}

export type CreateSessionFunction = (
  req: Request,
  res: Response,
  userData: Express.User
) => Promise<void>;

export class AuthEngine {
  private _session: Session;
  private providers: BaseProvider[];

  constructor({ providers, session }: IAuthEngineConfig) {
    if (!session || !session.secret) {
      throw new Error(
        "[FluidAuth]: Session configuration is required and must include secret '."
      );
    }

    if (!providers || !Array.isArray(providers)) {
      throw new Error("[FluidAuth]: Providers must be an array.");
    }

    this._session = new Session(session);
    this.providers = providers;
    console.log(this._session.sessionInfo);
    this.attachCreateSessionToProvider();
  }

  attachCreateSessionToProvider() {
    this.providers.forEach((provider) => {
      provider.loginUser = this._session.createSession.bind(this._session);
    });
  }

  authenticate(providerName: string) {
    if (!providerName) {
      throw new Error(
        "[FluidAuth](authenticateFunction): Provider name must be specified."
      );
    }

    const provider = this.providers.find(
      (eachProvider) => eachProvider.config.name === providerName
    );

    if (!provider) {
      throw new Error(
        "[FluidAuth](authenicateFunction): failed to find a provider with that name"
      );
    }

    return provider.authenticate.bind(provider);
  }

  handleCallback(ProviderName: string) {
    if (!ProviderName) {
      throw new FluidAuthError({
        name: ErrorName.MissingProviderNameError,
        message: "[FluidAuth](HandleRedirectUri): Missing Provider Name as param",
      });
    }

    const provider = this.providers.find(
      (providers) => providers.config.name === ProviderName
    );

    if (!provider) {
      throw new FluidAuthError({
        name: ErrorName.ProviderNotFoundError,
        message: `[FluidAuth](HandleRedirectUri): failed to find a privider with the name ${ProviderName}`,
      });
    }

    return provider.handleRedirectUri.bind(provider);
  }

  serializeUser(callback: (user: any) => any) {
    if (typeof callback !== "function") {
      throw new Error("[FluidAuth]: serializeUser callback must be a function.");
    }
    this._session.serializeUser = callback;
  }

  deserializeUser(callback: (id: string) => Express.User | null) {
    if (typeof callback !== "function") {
      throw new Error("[FluidAuth]: deserializeUser callback must be a function.");
    }
    this._session.deserializeUser = callback;
  }

  session() {
    return this._session.manageSession.bind(this._session);
  }
}
