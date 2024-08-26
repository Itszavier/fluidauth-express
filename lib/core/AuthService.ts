/** @format */

import { Request, Response, NextFunction } from "express";
import { Session, ISessionConfig } from "./session";
import { BaseProvider } from "../base/BaseProvider";
import { FluidAuthError, ErrorName } from "./Error";
import { IHandleCallbackOption, TRedirectType } from "../base";

export interface IRedirectConfig {
  onLoginSuccess?: string;
  onLoginFailure?: string;
}

export interface IAuthEngineConfig {
  providers: BaseProvider[];
  session: ISessionConfig;
  redirect?: Partial<IRedirectConfig>;
}

export class AuthService {
  private _session: Session;
  private providers: BaseProvider[];
  private redirectConfig: IRedirectConfig;

  constructor(config: IAuthEngineConfig) {
    if (!config.session || !config.session.secret) {
      throw new Error("[FluidAuth]: Session configuration must include a secret.");
    }

    if (!config.providers || !Array.isArray(config.providers)) {
      throw new Error("[FluidAuth]: Providers must be an array.");
    }

    this._session = new Session(config.session);
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

  private addToProviders() {
    const shouldRedirectFunction = this.shouldRedirect.bind(this);
    const redirectFunction = this.redirect.bind(this);

    this.providers.forEach((provider) => {
      provider.shouldRedirect = shouldRedirectFunction;
      provider.redirect = redirectFunction;
    });
  }

  private shouldRedirect(type: TRedirectType): boolean {
    switch (type) {
      case "login":
        return (
          !!this.redirectConfig.onLoginSuccess || !!this.redirectConfig.onLoginFailure
        );
      default:
        return false;
    }
  }

  private redirect(
    response: Response,
    type: TRedirectType,
    success: boolean = true
  ): void {
    if (!this.redirectConfig) return; // Handle undefined case

    let redirectUrl: string | undefined;

    if (type === "login") {
      redirectUrl = success
        ? this.redirectConfig.onLoginSuccess
        : this.redirectConfig.onLoginFailure;
    }

    if (redirectUrl) {
      response.redirect(redirectUrl);
    }
  }

  /* private getRedirectUrl(
    req: Request,
    config: string | ((req: Request, res: Response) => string) | undefined
  ): string | undefined {
    if (!config) return undefined;
    return typeof config === "function" ? config(req, req.res!) : config;
  }*/
}
