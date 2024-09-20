/** @format */
import qs from "querystring";
import { Request, Response, NextFunction } from "express";
import { BaseProvider, ValidationFunctionReturnType } from "../base";

interface IGitHubOAuthQueryParams {
  client_id: string; // Required
  redirect_uri?: string; // Strongly recommended
  login?: string; // Optional
  scope?: string; // Context dependent
  state?: string; // Strongly recommended
  allow_signup?: string; // Optional, default is true ("true" or "false")
  prompt?: string; // Optional
  code_challenge?: string; // PKCE parameter, optional
  code_challenge_method?: string; // PKCE parameter, optional
  [key: string]: string | undefined;
}

interface IGithubResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface IGitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "private" | "public" | null; // Visibility can be private, public, or null
}

// Type for the full response which contains an array of GitHubEmail objects
type GitHubEmailResponse = IGitHubEmail[];

export interface IGithubProfile {
  name: string | null;
  id: string;
  node_id: string;
  email: IGitHubEmail | null; // Optional in case the email is not provided
  picture: string; // Equivalent to avatar_url
  profileUrl: string; // Equivalent to html_url
  emails: IGitHubEmail[]; // Array of emails

  public: {
    url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    repos_url: string;
    followers: string;
    following: string;
    site_admin: boolean;
  };
}
export interface IGithubProviderCredentialConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  login?: string;
  scope?: string[];
}

export interface IGithubProviderConfig {
  credential: IGithubProviderCredentialConfig;
  validateUser: (
    data: IGithubResponse,
    profile: IGithubProfile
  ) => ValidationFunctionReturnType;
}

export class GithubProvider extends BaseProvider {
  providerConfig: IGithubProviderConfig;

  constructor(providerConfig: IGithubProviderConfig) {
    super({ type: "OAuth2", name: "github" });

    this.providerConfig = providerConfig;
  }

  async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const url = this.generateUrl();
    res.status(200).redirect(url);
  }

  async handleCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> {
    try {
      const error = req.query.error;
      const errorDescription = req.query.error_description;
      const code = req.query.code;

      if (error) {
        return res.status(401).json({
          success: false,
          error: {
            name: error,
            message: errorDescription,
          },
          message: errorDescription,
        });
      }

      const responseData = await this.exchangeCodeForAccessToken(
        code as string
      );
      const responseUser = await this.getUser(responseData.access_token);
      const emails = await this.getUserEmails(responseData.access_token);
      const profile = this.format(responseUser, emails);

      const validationFunction = this.providerConfig.validateUser.bind(
        null,
        responseData,
        profile
      );

      await this.handleLogin({
        context: { req, res, next },
        validationFunction,
      });
    } catch (error) {
      next(error);
    }
  }

  private async exchangeCodeForAccessToken(code: string) {
    try {
      const credential = this.providerConfig.credential;

      const params = new URLSearchParams({
        client_id: credential.clientId,
        client_secret: credential.clientSecret,
        redirect_uri: credential.redirectUri,
        code: code as string,
      });

      const authResponse = await fetch(
        `https://github.com/login/oauth/access_token?${params}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data: IGithubResponse = await authResponse.json();

      return data;
    } catch (error) {
      throw error;
    }
  }

  private async getUser(access_token: string) {
    try {
      const userResponse = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const data = await userResponse.json();

      return data;
    } catch (error) {
      throw error;
    }
  }

  private async getUserEmails(access_token: string) {
    try {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const emails: GitHubEmailResponse = await emailResponse.json();
      return emails;
    } catch (error) {
      throw error;
    }
  }

  format(data: GitHubUserProfile, emails: GitHubEmailResponse) {
    const primary_email = emails.find((email) => email.primary === true);

    const profile: IGithubProfile = {
      name: data.name || null,
      id: data.id.toString(), // Convert id to string if required by the IGithubProfile
      node_id: data.node_id,
      picture: data.avatar_url, // Mapping the avatar_url to picture
      profileUrl: data.html_url, // Mapping the html_url to profileUrl
      email: primary_email as IGitHubEmail, // Casting primary email to IGitHubEmail
      emails: emails as IGitHubEmail[], // Assuming all emails conform to IGitHubEmail

      public: {
        url: data.url,
        followers_url: data.followers_url,
        following_url: data.following_url,
        gists_url: data.gists_url,
        repos_url: data.repos_url,
        followers: data.followers.toString(), // Convert number to string if needed
        following: data.following.toString(), // Convert number to string if needed
        site_admin: data.site_admin,
      },
    };

    return profile; // Return the formatted profile
  }

  generateUrl() {
    const credential = this.providerConfig.credential;

    const scopes = credential.scope
      ? credential.scope.join(" ").trim()
      : ["read:user", "user:email"].join(" ").trim();

    const config: IGitHubOAuthQueryParams = {
      client_id: this.providerConfig.credential.clientId,
      redirect_uri: this.providerConfig.credential.redirectUri,
      scope: scopes,
    };

    const querystring = qs.stringify(config);

    const url = `https://github.com/login/oauth/authorize/?${querystring}`;

    return url;
  }
}

interface GitHubUserProfile {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null; // Can be null if not set
  company: string | null;
  blog: string;
  location: string | null; // Can be null if not set
  email: string | null; // Email is null if not public
  hireable: boolean | null; // Hireable can be null
  bio: string | null; // Can be null if not set
  twitter_username: string | null; // Can be null if not set
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}
