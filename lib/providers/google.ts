/** @format */
import querystring from "querystring";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BaseProvider, DoneFunction } from "../base/BaseProvider";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ErrorNames, FluidAuthError } from "../core/Error";

export interface IGoogleProfile {
  name?: string;
  email: string;
  email_verified: boolean;
  picture?: string;
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
  verify: (data: IGoogleData, profile: IGoogleProfile, done: DoneFunction) => any;
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

  private async verifyIdToken(idToken: string): Promise<JwtPayload> {
    const googleKeysUrl = "https://www.googleapis.com/oauth2/v3/certs";

    const response = await fetch(googleKeysUrl);
    const keys = await response.json();

    const decodedHeader = jwt.decode(idToken, { complete: true });
    const kid = decodedHeader?.header?.kid;

    const key = keys.keys.find((k: any) => k.kid === kid);

    if (!key) {
      throw new Error("Matching key not found");
    }

    const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;

    const verifiedPayload = jwt.verify(idToken, publicKey, {
      algorithms: ["RS256"],
      audience: this.configOptions.client_id,
      issuer: "https://accounts.google.com",
    }) as JwtPayload;

    if (Date.now() >= (verifiedPayload.exp || 0) * 1000) {
      throw new Error("ID token has expired");
    }

    return verifiedPayload;
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

      if (!data.id_token) {
        throw new Error("ID token is missing in the response");
      }

      const payload = await this.verifyIdToken(data.id_token);

      const profile: IGoogleProfile = {
        email: payload.email as string,
        email_verified: payload.email_verified as boolean,
        name: payload.name as string,
        picture: payload.picture as string,
      };

      this.configOptions.verify(data, profile, async (error, user, info) => {
        if (error) {
          return next(error);
        }

        if (!user) {
          return next(new FluidAuthError({ mess }));
        }

        await this.createSession(req, res, user);
        // Handle successful authentication (e.g., create session, set cookies, etc.)
        res.json({ message: "User authenticated", user });
      });
    } catch (error) {
      console.error("Error handling redirect URI:", error);
      res.status(500).send("Internal Server Error");
      next(error);
    }
  }
}
