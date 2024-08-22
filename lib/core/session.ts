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

  /**
   * manage the session on every request
   * @param req
   * @param res
   * @param next
   * @returns
   */

  async manageSession(req: Request, res: Response, next: NextFunction) {
    const session = req.cookies[this.sessionInfo.name];

    if (!session) {
      return next();
    }

    const sessionId = await decrypt(session, this.sessionInfo.secret);

    try {
   
      const sessionData = await this.store.get(sessionId);

      if (!sessionData) {
       
        res.clearCookie(this.sessionInfo.name);
        return next();
      }

      if (new Date(sessionData.expires).getTime() <= Date.now()) {
        console.log(`[Debug]: Session expired, clearing session cookie`);
        res.clearCookie(this.sessionInfo.name);
        return next();
      }

      req.session = sessionData;
      next();
      req.user = await this.deserializeUser(sessionData.user);
    
    } catch (error) {
      next(error);
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
