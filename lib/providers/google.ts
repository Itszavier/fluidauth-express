/** @format */
import querystring from "querystring";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";
import FluidAuth from "..";

export interface IGoogleProviderConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
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

    const scopes = this.configOptions.scopes.join(" ");

    const config = {
      response_type: "code",
      client_id: this.configOptions.client_id,
      scope: scopes,
      redirect_uri: this.configOptions.redirect_uri,
      state: state,
    };

    

    const url = "https://accounts.google.com/o/oauth2/v2/auth";

    const params = querystring.stringify(config);
    console.log(params);
    res.redirect(`${url}?${params}`);
  }

  async exchangeCodeForAccessToken(code: string): Promise<any> {
    const api_url = "https://oauth2.googleapis.com/token";

    const params = new URLSearchParams({
      code: code,
      client_id: this.configOptions.client_id,
      client_secret: this.configOptions.client_secret,
      redirect_uri: this.configOptions.redirect_uri,
      grant_type: "authorization_code",
    });

    try {
      const response = await fetch(api_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text(); // capture the error response
        throw new Error(
          `Failed to exchange code for token: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error exchanging code for access token:", error);
      throw error; // rethrow the error after logging it
    }
  }

  async handleRedirectUri(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, state } = req.query;
      const data = await this.exchangeCodeForAccessToken(code as string);

      console.log(data);
    } catch (error) {
      next(error);
    }
  }
}
