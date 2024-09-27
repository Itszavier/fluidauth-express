/** @format */

import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import qs from "qs";
import { BaseProvider, ValidationFunctionReturnType } from "../base";

export type DiscordOAuth2Scope =
  | "activities.read"
  | "activities.write"
  | "applications.builds.read"
  | "applications.builds.upload"
  | "applications.commands"
  | "applications.commands.update"
  | "applications.commands.permissions.update"
  | "applications.entitlements"
  | "applications.store.update"
  | "bot"
  | "connections"
  | "dm_channels.read"
  | "email"
  | "gdm.join"
  | "guilds"
  | "guilds.join"
  | "guilds.members.read"
  | "identify"
  | "messages.read"
  | "relationships.read"
  | "role_connections.write"
  | "rpc"
  | "rpc.activities.write"
  | "rpc.notifications.read"
  | "rpc.voice.read"
  | "rpc.voice.write"
  | "voice"
  | "webhook.incoming";

export interface DiscordData {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordProfile {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string | null;
  accent_color: number | null;
  global_name: string | null;
  avatar_decoration_data: string | null;
  banner_color: string | null;
  clan: string | null;
  mfa_enabled: boolean;
  locale: string;
  premium_type: number;
  email: string;
  verified: boolean;
}

export interface DiscordProviderConfig {
  credential: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: DiscordOAuth2Scope[];
    prompt?: "none" | "consent";
  };
  validateUser(discordData: DiscordData, profile: DiscordProfile): ValidationFunctionReturnType;
}

export class DiscordProvider extends BaseProvider {
  providerConfig: DiscordProviderConfig;
  private discordApiBaseUrl = "https://discord.com/api/v10";

  constructor(config: DiscordProviderConfig) {
    super({ name: "discord", type: "OAUTH2" });
    this.providerConfig = config;
  }

  public authenticate(req: Request, res: Response, next: NextFunction): void {
    res.redirect(this.generateUrl());
  }

  public async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, error, error_description } = req.query;

      if (error || error_description) {
        return this.handleAuthError({
          context: { req, res, next },
          message: (error_description as string) || (error as string),
        });
      }

      const data = await this.exchangeCodeForToken(code as string);
      const profile = await this.fetchDiscordUser(data.token_type, data.access_token);

      const validationFunction = this.providerConfig.validateUser.bind(null, data, profile);

      await this.handleLogin({ context: { req, res, next }, validationFunction });

    } catch (error) {
      if (error instanceof Error) {
        this.handleAuthError({ context: { req, res, next }, message: error.message });
      }
      next(error);
    }
  }

  private async exchangeCodeForToken(code: string): Promise<DiscordData> {
    const { clientId, clientSecret } = this.providerConfig.credential || {};

    const querystring = qs.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: this.providerConfig.credential.redirectUri,
    });

    const base64Credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "post",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + base64Credentials,
      },
      body: querystring.toString(),
    });

    return response.json();
  }

  async fetchDiscordUser(token_type: string, access_token: string): Promise<DiscordProfile> {
    const response = await fetch(`${this.discordApiBaseUrl}/users/@me`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`failed to fetch user due to ${response.statusText} code ${response.status}`);
    }
    const user = await response.json();

    return user as DiscordProfile;
  }

  generateUrl(): string {
    const {
      credential: { clientId, clientSecret, redirectUri, scopes },
    } = this.providerConfig;

    const scope: DiscordOAuth2Scope[] = scopes || ["identify", "email", "guilds"];

    const url = "https://discord.com/oauth2/authorize";

    const querystring = qs.stringify({
      response_type: "code",
      client_id: clientId,
      redirectUri: redirectUri,
      scope: scope.join(" "),
      prompt: this.providerConfig.credential.prompt || "consent",
    });

    return `${url}?${querystring}`;
  }
}
