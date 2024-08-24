/** @format */

import { Response, Request, NextFunction, CookieOptions } from "express";
import { BaseSessionStore, SessionData } from "../base/baseSessionStore";
import crypto from "crypto";
import { MemoryStore } from "./memoryStore";
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
  sessionInfo: { name: string; secret: string; expires: Date };
  cookieOption: CookieOptions;
  store: BaseSessionStore;
  private sessionDuration: number;

  request!: Request;
  response!: Response;

  public serializeUser!: SerializeUserFunction;
  public deserializeUser!: DeserializeUserFunction;

  constructor(config: ISessionConfig) {
    this.sessionDuration = config.sessionDuration || 30 * 60 * 1000; // 30 min by default

    this.cookieOption = {
      maxAge: this.sessionDuration,
      ...config.cookie,
    };

    this.sessionInfo = {
      name: config.name || "fluid-auth-session",
      secret: config.secret,
      expires: this.getExpirationDate(),
    };

    this.store = config.store || new MemoryStore();
  }

  getExpirationDate() {
    return new Date(Date.now() + this.sessionDuration);
  }

  /**
   * manage the session on every request
   * @param req
   * @param res
   * @param next
   * @returns
   */

  async createSession(userData: Express.User) {
    this.ensureRequestIsPresent();

    const userId = await this.serializeUser(userData);

    const sessionData: ISessionData = {
      sessionId: this.generateId(),
      expires: this.getExpirationDate(),
      userId: userId,
    };

    this.response.cookie(
      this.sessionInfo.name,
      encrypt(sessionData.sessionId, this.sessionInfo.secret),
      this.cookieOption
    );

    await this.store.create(sessionData);

    this.request.session.cookie = this.cookieOption;

    this.request.session.user = await this.deserializeUser(sessionData.userId);

    this.request.user = this.request.session.user as Express.User;
  }

  async destroySession() {
    this.ensureRequestIsPresent();

    try {
      const session = this.request.cookies[this.sessionInfo.name];

      if (!session) {
        return;
      }

      const sessionId = decrypt(session, this.sessionInfo.secret);

      await this.store.delete(sessionId);

      this.response.clearCookie(this.sessionInfo.name);
      
      this.request.session.user = null;
      this.request.session.cookie = null;
    } catch (error) {
      throw error;
    }
  }

  async manageSession(req: Request, res: Response, next: NextFunction) {
    // Initialize req.session if not already set
    req.session = {
      ...req.session, // Preserve any existing session data
      create: this.createSession.bind(this),
      destroy: this.destroySession.bind(this),
    };

    this.request = req;
    this.response = res;

    const session = req.cookies[this.sessionInfo.name];

    if (!session) return next();

    const sessionId = decrypt(session, this.sessionInfo.secret);

    try {
      const sessionData = await this.store.get(sessionId);

      if (!sessionData) {
        this.destroySession();
        return next();
      }

      if (new Date(sessionData.expires).getTime() <= Date.now()) {
        console.log(`[Debug]: Session expired, clearing session cookie`);
        await this.destroySession();
        return next();
      }

      req.session.cookie = this.cookieOption;
      req.session.user = await this.deserializeUser(sessionData.userId);
      req.user = req.session.user as Express.User;

      next();
    } catch (error) {
      await this.destroySession();
      next(error);
    }
  }

  generateId(): string {
    return crypto.randomBytes(18).toString("hex");
  }

  private ensureRequestIsPresent() {
    if (!this.request || !this.response) {
      throw new Error("Request and Response objects are not set.");
    }
  }
}

export default function session(config: ISessionConfig) {
  const session = new Session(config);

  return session.manageSession.bind(session);
}
