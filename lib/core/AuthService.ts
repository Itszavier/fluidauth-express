/** @format */

import { Request, Response, NextFunction } from "express";
import { Session, ISessionConfig } from "./session";
import { BaseProvider } from "../base/BaseProvider";
import { FluidAuthError, ErrorName } from "./Error";

export interface IAuthEngineConfig {
  providers: BaseProvider[];
  session: ISessionConfig;
}

export class AuthService {
  private _session: Session;
  private providers: BaseProvider[];

  constructor({ providers, session }: IAuthEngineConfig) {
    if (!session || !session.secret) {
      throw new Error("[FluidAuth]: Session configuration must include a secret.");
    }

    if (!providers || !Array.isArray(providers)) {
      throw new Error("[FluidAuth]: Providers must be an array.");
    }

    this._session = new Session(session);
    this.providers = providers;
  }

  public authenticate(providerName: string) {
    if (!providerName) {
      throw new Error("[FluidAuth](authenticate): Provider name must be specified.");
    }

    const provider = this.providers.find((p) => p.config.name === providerName);

    if (!provider) {
      throw new Error("[FluidAuth](authenticate): Provider not found.");
    }

    return provider.authenticate.bind(provider);
  }

  public handleCallback(providerName: string) {
    if (!providerName) {
      throw new FluidAuthError({
        name: ErrorName.MissingProviderNameError,
        message: "[FluidAuth](handleCallback): Missing provider name.",
      });
    }

    const provider = this.providers.find((p) => p.config.name === providerName);

    if (!provider) {
      throw new FluidAuthError({
        name: ErrorName.ProviderNotFoundError,
        message: `[FluidAuth](handleCallback): Provider ${providerName} not found.`,
      });
    }

    return provider.handleRedirectUri.bind(provider);
  }

  public serializeUser(callback: (user: any) => any) {
    if (typeof callback !== "function") {
      throw new Error("[FluidAuth]: serializeUser callback must be a function.");
    }
    this._session.serializeUser = callback;
  }

  public deserializeUser(callback: (id: string) => Promise<Express.User | null>) {
    if (typeof callback !== "function") {
      throw new Error("[FluidAuth]: deserializeUser callback must be a function.");
    }
    this._session.deserializeUser = callback;
  }

  public session() {
    return this._session.manageSession.bind(this._session);
  }

  public initialize() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.login = async (user) => {
        if (!req.session) {
          return;
        }
        await req.session.create(user);
      };

      req.logout = async () => {
        if (!req.session) {
          return;
        }

        await req.session.destroy();
      };

      req.isAuthenticated = () => !!req.session.user;

      next();
    };
  }
}
