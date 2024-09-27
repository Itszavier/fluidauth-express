/** @format */

import { Request, Response, NextFunction } from "express";
import { Session, ISessionConfig } from "./session";
import { BaseProvider } from "../base/BaseProvider";
import { FluidAuthError, ErrorName } from "./Error";
import { TRedirectType } from "../base";
import { validateSessionConfig } from "../utils/dev";

export interface IRedirectConfig {
  successRedirect?: string; // URL to redirect to after successful login
  failureRedirect?: string;
}

export interface IAuthServiceConfig {
  providers: BaseProvider[];
  session: Session | ISessionConfig;
  redirect?: Partial<IRedirectConfig>;
}

export class AuthService {
  private _session: Session;
  private providers: BaseProvider[];
  private redirectConfig: IRedirectConfig;

  constructor(config: IAuthServiceConfig) {
    if (!config.providers || !Array.isArray(config.providers)) {
      throw new Error("[FluidAuth]: Providers must be an array.");
    }

    if (config.session instanceof Session) {
      this._session = config.session;
    } else {
      try {
        validateSessionConfig(config.session);
        this._session = new Session(config.session);
      } catch (error) {
        throw error;
      }
    }

    this.providers = config.providers;
    this.redirectConfig = config.redirect || {};
    this.addToProviders();
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

    return provider.handleCallback.bind(provider);
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

  private addToProviders() {
    const shouldRedirectFunction = this.shouldRedirect.bind(this);


    this.providers.forEach((provider) => {
      provider.shouldRedirect = shouldRedirectFunction;
      provider._local = { redirect: this.redirectConfig };
    });
  }

  private shouldRedirect(type: TRedirectType): boolean {
    switch (type) {
      case "login":
        return !!this.redirectConfig.successRedirect || !!this.redirectConfig.successRedirect;
      default:
        return false;
    }
  }
 
}
