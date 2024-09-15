/** @format */

import querystring from "querystring";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider, IValidationData } from "../base/BaseProvider";
import { VerifyUserFunctionReturnType } from "../base";

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
  credential: {
    redirectUri: string;
    clientId: string;
    clientSecret: string;
    scopes?: string[];
  };

  verifyUser: (GoogleAuthData: IGoogleData, Profile: IGoogleProfile) => VerifyUserFunctionReturnType;
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

    const scopes = this.configOptions.credential.scopes
      ? this.configOptions.credential.scopes.join(" ")
      : "openid profile email";

    const config = {
      response_type: "code",
      client_id: this.configOptions.credential.clientId,
      scope: scopes,
      redirect_uri: this.configOptions.credential.redirectUri,
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
        throw new Error("Failed to fetch user info from Google");
      }

      const data = await response.json();
      return data as IGoogleProfile;
    } catch (error) {
      throw error;
    }
  }

  private async exchangeCodeForAccessToken(code: string): Promise<IGoogleData> {
    const api_url = "https://oauth2.googleapis.com/token";

    const params = new URLSearchParams({
      code: code,
      client_id: this.configOptions.credential.clientId,
      client_secret: this.configOptions.credential.clientSecret,
      redirect_uri: this.configOptions.credential.redirectUri,
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
      return data as IGoogleData;
    } catch (error) {
      throw error;
    }
  }

  async handleRedirectUri(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code;
      const error = req.query.error;

      if (error) {
        res.status(401).json({
          error: "access_denied",
          message: "Authorization was denied. Please try again or contact support if you need assistance.",
        });
        return;
      }

      const data: IGoogleData = await this.exchangeCodeForAccessToken(code as string);

      const profile = await this.getUserInfo(data.access_token);

      const verifyFunction = this.configOptions.verifyUser.bind(null, data, profile);

      await this.handleLogin(req, res, verifyFunction);
    } catch (error) {
      next(error);
    }
  }
}
