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

interface DiscordData {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
export interface DiscordProviderConfig {
  credential: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes?: DiscordOAuth2Scope[];
    prompt?: "none" | "consent";
  };

  validateUser(discordData: DiscordData, profile: any): ValidationFunctionReturnType;
}

export class DiscordProvider extends BaseProvider {
  providerConfig: DiscordProviderConfig;

  constructor(config: DiscordProviderConfig) {
    super({ name: "discord", type: "OAUTH2" });
    this.providerConfig = config;
  }

  public authenticate(req: Request, res: Response, next: NextFunction): void {
    res.redirect(this.generateUrl());
  }

  public async handleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { code, error, error_description } = req.query;

    if (error || error_description) {
      return this.handleAuthError({
        context: { req, res, next },
        message: (error_description as string) || (error as string),
      });
    }

    const data = await this.exchangeCodeForToken(code as string);

    const validationFunction = this.providerConfig.validateUser.bind(null, data, null);

    res.json({ message: "worked" });
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
