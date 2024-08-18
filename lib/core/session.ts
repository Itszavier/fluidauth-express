/** @format */

import { Response, Request, NextFunction, CookieOptions } from "express";
import { BaseSessionStore, SessionData } from "../base/baseSessionStore";
import crypto from "crypto";
import { MemoryStore } from "./memoryStore";
import { decrypt } from "../utils/dev";

export interface ISession {
  name: string;
  expires: Date;
  user: string | Express.User;
  [key: string]: any;
}

export interface ISessionConfig {
  name?: string;
  secret: string;
  cookie?: CookieOptions;
  store?: BaseSessionStore;
}

export type SerializeUserFunction = (user: Express.User) => any;

export type DeserializeUserFunction = (id: string) => any;

export class Session {
  sessionInfo: { name: string; secret: string; expires: Date };
  cookieOption: CookieOptions;
  store: BaseSessionStore;
  public serializeUser!: SerializeUserFunction;
  public deserializeUser!: DeserializeUserFunction;

  constructor(config: ISessionConfig) {
    this.cookieOption = config.cookie || {};

    this.sessionInfo = {
      name: config.name || "fluid-auth-session",
      secret: config.secret,
      expires: config.cookie?.expires || this.getOneWeekFromNow(),
    };

    this.store = config.store || new MemoryStore();
  }

  private getOneWeekFromNow(): Date {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days
    return oneWeekFromNow;
  }

  async manageSession(req: Request, res: Response, next: NextFunction) {
    const session = req.cookies[this.sessionInfo.name];

    if (!session) {
      console.log(`[Debug]: No session cookie found`);
      return next();
    }

    const sessionId = await decrypt(session, this.sessionInfo.secret);

    if (sessionId) {
      console.log(`[Debug]: Decryption successful. Session ID: ${sessionId}`);
    } else {
      console.error(`[Error]: Decryption failed. Session ID could not be retrieved.`);
    }

    try {
      console.log(
        `[Debug]: Attempting to retrieve session data for session ID: ${sessionId}`
      );
      const sessionData = await this.store.get(sessionId);

      if (!sessionData) {
        console.log(`[Debug]: No session data found for session ID: ${sessionId}`);
        res.clearCookie(this.sessionInfo.name);
        return next();
      }

      if (new Date(sessionData.expires).getTime() <= Date.now()) {
        console.log(`[Debug]: Session expired, clearing session cookie`);
        res.clearCookie(this.sessionInfo.name);
        return next();
      }

      console.log(`[Debug]: Session is valid, attaching session data to req.session`);
      req.session = sessionData;
      next();
      req.user = await this.deserializeUser(sessionData.user);
      console.log(`[Debug]: User deserialized: ${JSON.stringify(req.user)}`);
    } catch (error) {
      next(error);
      console.error(`[Error]: Failed to retrieve session data:`, error);
      res.clearCookie(this.sessionInfo.name);
    }
  }

  generateId(): string {
    return crypto.randomBytes(18).toString("hex");
  }
}

export default function session(config: ISessionConfig) {
  const session = new Session(config);
  return session.manageSession;
}
