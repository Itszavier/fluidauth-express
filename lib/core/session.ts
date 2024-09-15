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
  extendSessionBeforeExpiry?: boolean;
  sessionExtensionThresholdInMs?: number;
}

function isSessionExpired(sessionData: ISessionData): boolean {
  const results = new Date(sessionData.expires).getTime() <= Date.now();
  return results;
}

function getExpirationDate(duration: number): Date {
  return new Date(Date.now() + duration);
}

export class Session {
  sessionInfo: { name: string; secret: string };
  cookieOption: CookieOptions;

  config: ISessionConfig;
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
    };

    this.store = config.store || new MemoryStore();

    this.cleanSession().catch((error) => {
      console.error("Failed to clean session on startup", error);
    });

    this.config = config;
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

      if (sessionData === null) {
        this.destroySession(req, res);
        return next();
      }

      if (this.shouldExtendSession(sessionData, this.config.sessionExtensionThresholdInMs)) { 
        await this.extendCurrentSession(req, res);
      }

      if (isSessionExpired(sessionData)) {
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
        expires: getExpirationDate(this.sessionDuration).toISOString(),
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

  private shouldExtendSession(sessionData: ISessionData, threshold: number = 4 * 60 * 1000): boolean {
    if (!this.config.extendSessionBeforeExpiry) {
      return false;
    }

    const timeToExpiry = new Date(sessionData.expires).getTime() - Date.now();
    const shouldExtend = timeToExpiry <= threshold;

    return shouldExtend;
  }

  public async cleanSession() {
    return await this.store.clean();
  }

  public async getSession(sessionId: string) {
    return await this.store.get(sessionId);
  }

  public async deleteSession(sessionId: string) {
    return await this.store.delete(sessionId);
  }

  /** extends the session in the database using sessionId */
  public async extendSession(sessionId: string, newDuration?: number) {
    const sessionData = await this.store.get(sessionId);

    const extendedTime = newDuration || this.sessionDuration;

    if (!sessionData) return;

    const newExpiration = new Date(Date.now() + extendedTime);

    sessionData.expires = newExpiration.toISOString();

    await this.store.update(sessionId, sessionData);
  }

  /** extend current session in the database using sessionId */
  public async extendCurrentSession(req: Request, res: Response, newDuration?: number) {
    const sessionCookie = req.cookies[this.sessionInfo.name];

    if (!sessionCookie) {
      return; // No session cookie found; no session to extend
    }

    try {
      const sessionId = this.decryptSessionId(sessionCookie);
      const extendDuration = newDuration || this.sessionDuration; // Default to session duration, or you can pass a specific duration
      await this.extendSession(sessionId, extendDuration);

      // Optionally, update the cookie expiration if you want to match it with the new session duration
      res.cookie(
        this.sessionInfo.name,
        sessionCookie, // sessionId was already encrypted in the cookie
        { ...this.cookieOption, maxAge: extendDuration }
      );
    } catch (error) {
      throw error;
    }
  }
}
