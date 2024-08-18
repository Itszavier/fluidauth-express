/** @format */
import querystring from "querystring";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";

export interface IGoogleProviderConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string[];
}

export class GoogleProvider extends BaseProvider {
  private configOptions: IGoogleProviderConfig;

  constructor(config: IGoogleProviderConfig) {
    super({
      name: "google",
      type: "OAuth2",
    });

    this.configOptions = config;
  }

  async getUserInfo(AccessToken: string) {}

  authenticate(req: Request, res: Response, next: NextFunction): void {
    const state = crypto.randomBytes(8).toString("hex");

    const config = {
      response_type: "code",
      client_id: this.configOptions.client_id,
      scope:'openid profile email',
      redirect_uri: this.configOptions.redirect_uri,
      state: state,
    };

    const url = "https://accounts.google.com/o/oauth2/v2/auth";

    const params = querystring.stringify(config);
    console.log(params);
    res.redirect(`${url}?${params}`);
  }

  async handleRedirectUri(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    console.log(req.params);
  }
}
