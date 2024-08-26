/** @format */

import {
  Response,
  Request,
  NextFunction,
  CookieOptions,
  response,
} from "express";
import crypto from "crypto";
import { BaseSessionStore } from "../base/baseSessionStore";
import { MemoryStore } from "./memoryStore"; // Example store
import { decrypt, encrypt } from "../utils/dev";
import {
  DeserializeUserFunction,
  ISessionData,
  SerializeUserFunction,
} from "../base/types";

export interface ISessionConfig {
  name?: string;
  secret: string;
  sessionDuration?: number;
  cookie?: CookieOptions;
  store?: BaseSessionStore;
}

export class Session {
  private readonly sessionInfo: { name: string; secret: string; expires: Date };
  private readonly cookieOption: CookieOptions;
  private readonly store: BaseSessionStore;
  private readonly sessionDuration: number;

  public serializeUser!: SerializeUserFunction;
  public deserializeUser!: DeserializeUserFunction;

  constructor(config: ISessionConfig) {
    this.validateConfig(config);

    this.sessionDuration = config.sessionDuration || 30 * 60 * 1000; // Default: 30 minutes

    this.cookieOption = {
      maxAge: this.sessionDuration,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure flag in production
      sameSite: "strict", // CSRF protection
      ...config.cookie,
    };

    this.sessionInfo = {
      name: config.name || "fluid-auth-session",
      secret: config.secret,
      expires: this.getExpirationDate(),
    };

    this.store = config.store || new MemoryStore(); // Default to in-memory store
  }

  public async manageSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.init(req, res);

    const sessionCookie = req.cookies[this.sessionInfo.name];

    if (!sessionCookie) {
      return next();
    }

    try {
      const sessionId = this.decryptSessionId(sessionCookie);
      const sessionData = await this.store.get(sessionId);

      if (sessionData === null || this.isSessionExpired(sessionData)) {
        await this.destroySession(req, res);
        return next();
      }

      req.session.user = await this.deserializeUser(sessionData.userId);
      req.user = req.session.user as Express.User;

      next();
    } catch (error) {
      await this.destroySession(req, res);
      next(error);
    }
  }
  private validateConfig(config: ISessionConfig): void {
    if (!config.secret) {
      throw new Error(
        "Session secret is required for encryption and decryption."
      );
    }
    if (config.sessionDuration && config.sessionDuration <= 0) {
      throw new Error("Session duration must be a positive number.");
    }
  }

  private getExpirationDate(): Date {
    return new Date(Date.now() + this.sessionDuration);
  }

  private init(req: Request, res: Response) {
    req.session = {
      user: null,
      cookie: null,
      create: this.createSession.bind(this, req, res),
      destroy: this.destroySession.bind(this, req, res),
    };
  }

  private isSessionExpired(sessionData: ISessionData): boolean {
    return new Date(sessionData.expires).getTime() <= Date.now();
  }

  private decryptSessionId(sessionCookie: string): string {
    try {
      return decrypt(sessionCookie, this.sessionInfo.secret);
    } catch {
      throw new Error("Invalid session ID.");
    }
  }

  public async createSession(
    req: Request,
    res: Response,
    userData: Express.User
  ): Promise<void> {
    try {
      const userId = await this.serializeUser(userData);

      const sessionData: ISessionData = {
        sessionId: this.generateId(),
        expires: this.getExpirationDate(),
        userId: userId,
      };

      await this.store.create(sessionData);

      res.cookie(
        this.sessionInfo.name,
        encrypt(sessionData.sessionId, this.sessionInfo.secret),
        this.cookieOption
      );

      req.session.user = await this.deserializeUser(sessionData.userId);
      req.user = req.session.user as Express.User;
    } catch (error) {
      throw error;
    }
  }

  public async destroySession(req: Request, res: Response): Promise<void> {
    if (res.headersSent) {
      return;
    }

    const sessionCookie = req.cookies[this.sessionInfo.name];

    if (!sessionCookie) {
      return;
    }

    try {
      const sessionId = this.decryptSessionId(sessionCookie);
      await this.store.delete(sessionId);
      res.clearCookie(this.sessionInfo.name);
      req.session.user = null;
    } catch (error) {
      throw error;
    }
  }

  private generateId(): string {
    return crypto.randomBytes(18).toString("hex");
  }
}
