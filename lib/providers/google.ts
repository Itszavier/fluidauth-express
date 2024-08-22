/** @format */
import querystring from "querystring";

import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider, IValidationData } from "../base/BaseProvider";

export interface IGoogleProfile {
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

export interface IGoogleData {
  id_token?: string;
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scopes: string;
}

export interface IGoogleProviderConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes?: string[];
  verify: (data: IGoogleData, profile: IGoogleProfile) => Promise<IValidationData>;
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

  authenticate(req: Request, res: Response): void {
    const state = crypto.randomBytes(8).toString("hex");
    
    const scopes = this.configOptions.scopes ?  this.configOptions.scopes.join(" ") : "openid profile email";

    const config = {
      response_type: "code",
      client_id: this.configOptions.client_id,
      scope: scopes,
      redirect_uri: this.configOptions.redirect_uri,
      state: state,
    };

    const url = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = querystring.stringify(config);

    res.redirect(`${url}?${params}`);
  }

  private async getUserInfo(accessToken: string): Promise<IGoogleProfile> {
    const api_url = "https://www.googleapis.com/oauth2/v3/userinfo";

    try {
      const response = await fetch(api_url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user info from google");
      }

      const data = await response.json();
      return data as IGoogleProfile;
    } catch (error) {
      throw error;
    }
  }

  private async exchangeCodeForAccessToken<T extends object>(code: string): Promise<T> {
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
        const errorText = await response.text();
        throw new Error(
          `Failed to exchange code for token: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async handleRedirectUri(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { code, state } = req.query;

      if (!code) {
        throw new Error("Authorization code is missing");
      }

      const data: IGoogleData = await this.exchangeCodeForAccessToken(code as string);
      const profile = await this.getUserInfo(data.access_token);
      const validationInfo = await this.configOptions.verify(data, profile);
      const user = this.validateInfo(validationInfo);

      await this.loginUser(req, res, user);

      res.status(200).json({ message: "authorize" });
    } catch (error) {
      res.status(500).send(`Internal Server Error ${error}`);
      next(error);
    }
  }
}
