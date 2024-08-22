/** @format */
import querystring from "querystring";
import utils from "util";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider, IVerifyFunctionValidationData } from "../base/BaseProvider";
import jwt, { JwtPayload } from "jsonwebtoken";
import { DoneFunction, VerifyAsyncReturnType } from "../base/types";
import { FluidAuthError } from "../core/Error";

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
  scopes: string[];
  verify: (
    data: IGoogleData,
    profile: IGoogleProfile
  ) => Promise<IVerifyFunctionValidationData>;
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
        throw new Error("Failed to fetch user info");
      }

      const data = await response.json();
      return data as IGoogleProfile;
    } catch (error) {
      console.error("Error fetching user info:", error);
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
      console.error("Error exchanging code for access token:", error);
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

      const data = await this.exchangeCodeForAccessToken<IGoogleData>(code as string);

      const userData = await this.getUserInfo(data.access_token);

      const profile: IGoogleProfile = userData;

      const info = await this.configOptions.verify(data, profile);

      const user = this.validateInfo(info);

      res.status(200).json({ message: "authorize", user });
    } catch (error) {
      console.error("Error handling redirect URI:", error);
      res.status(500).send(`Internal Server Error ${error}`);
      next(error);
    }
  }
}
