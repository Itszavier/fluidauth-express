/** @format */

import { Response, Request, NextFunction, CookieOptions, response } from "express";
import crypto from "crypto";
import { BaseSessionStore } from "../base/baseSessionStore";
import { MemoryStore } from "./memoryStore"; // Example store
import { decrypt, encrypt, validateSessionConfig } from "../utils/dev";
import { DeserializeUserFunction, ISessionData, SerializeUserFunction } from "../base/types";

export interface ISessionConfig {
  name?: string;
  secret: string;
  sessionDuration?: number;
  cookie?: CookieOptions;
  store?: BaseSessionStore;
}

function isSessionExpired(sessionData: ISessionData): boolean {
  return new Date(sessionData.expires).getTime() <= Date.now();
}

function getExpirationDate(duration: number): Date {
  return new Date(Date.now() + duration);
}

export class Session {
  sessionInfo: { name: string; secret: string; expires: Date };
  cookieOption: CookieOptions;
  store: BaseSessionStore;
  sessionDuration: number;

  public serializeUser!: SerializeUserFunction;
  public deserializeUser!: DeserializeUserFunction;

  constructor(config: ISessionConfig) {
    validateSessionConfig(config);

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
      expires: getExpirationDate(this.sessionDuration),
    };

    this.store = config.store || new MemoryStore(); // Default to in-memory store
  }

  public async manageSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.initialize(req, res);

    const sessionCookie = req.cookies[this.sessionInfo.name];

    if (!sessionCookie) {
      return next();
    }

    try {
      const sessionId = this.decryptSessionId(sessionCookie);
      const sessionData = await this.store.get(sessionId);

      if (sessionData === null || isSessionExpired(sessionData)) {
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

  private initialize(req: Request, res: Response) {
    req.session = {
      user: null,
      cookie: null,
      data: {},
      create: this.createSession.bind(this, req, res),
      destroy: this.destroySession.bind(this, req, res),
      delete: this.deleteSession.bind(this),
      clean: this.cleanSession.bind(this),
    };
  }

  private decryptSessionId(sessionCookie: string): string {
    try {
      return decrypt(sessionCookie, this.sessionInfo.secret);
    } catch {
      throw new Error("Invalid session ID.");
    }
  }

  public async createSession(req: Request, res: Response, userData: Express.User): Promise<void> {
    try {
      const userId = await this.serializeUser(userData);

      const sessionData: ISessionData = {
        sessionId: this.generateId(),
        expires: getExpirationDate(this.sessionDuration),
        userId: userId,
      };

      await this.store.create(sessionData);

      req.session.user = await this.deserializeUser(sessionData.userId);
      req.user = req.session.user as Express.User;

      res.cookie(
        this.sessionInfo.name,
        encrypt(sessionData.sessionId, this.sessionInfo.secret),
        this.cookieOption
      );
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
      req.user = null;
      req.session.user = null;
    } catch (error) {
      throw error;
    }
  }

  private generateId(): string {
    return crypto.randomBytes(18).toString("hex");
  }

  public async cleanSession() {
    return await this.store.clean();
  }

  public async deleteSession(sessionId: string) {
    return await this.store.delete(sessionId);
  }
}
