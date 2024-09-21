/** @format */

import querystring from "querystring";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";
import { ValidationFunctionReturnType } from "../base";

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

  validateUser: (GoogleAuthData: IGoogleData, Profile: IGoogleProfile) => ValidationFunctionReturnType;
}

export class GoogleProvider extends BaseProvider {
  private providerConfig: IGoogleProviderConfig;

  constructor(config: IGoogleProviderConfig) {
    super({
      type: "OAUTH2",
      name: "google",
    });

    this.providerConfig = config;
  }

  authenticate(req: Request, res: Response): void {
    const state = crypto.randomBytes(8).toString("hex");

    const scopes = this.providerConfig.credential.scopes
      ? this.providerConfig.credential.scopes.join(" ")
      : "openid profile email";

    const config = {
      response_type: "code",
      client_id: this.providerConfig.credential.clientId,
      scope: scopes,
      redirect_uri: this.providerConfig.credential.redirectUri,
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
      client_id: this.providerConfig.credential.clientId,
      client_secret: this.providerConfig.credential.clientSecret,
      redirect_uri: this.providerConfig.credential.redirectUri,
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

  async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code;
      const error = req.query.error as string | undefined;

      if (error) {
        this.handleAuthError({ context: { req, res, next }, message: error });
        return;
      }

      const data: IGoogleData = await this.exchangeCodeForAccessToken(code as string);

      const profile = await this.getUserInfo(data.access_token);
      const { validateUser } = this.providerConfig;
      const validationFunction = validateUser.bind(null, data, profile);

      await this.handleLogin({
        context: { req, res, next },
        validationFunction,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.handleAuthError({
          context: { req, res, next },
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }
}
