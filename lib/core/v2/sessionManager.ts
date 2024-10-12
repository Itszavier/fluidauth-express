/** @format */
import { Request, Response, NextFunction } from "express";
import { ISessionConfig, Session } from "../session";

export default class SessionManager {
  session: Session;

  constructor(sessionConfig: ISessionConfig | Session) {
    // Check if sessionConfig is valid, either as an instance of Session or a valid config object
    if (sessionConfig instanceof Session) {
      this.session = sessionConfig;
    } else if (sessionConfig && typeof sessionConfig === "object") {
      this.session = new Session(sessionConfig);
    } else {
      // Throw an error if sessionConfig is undefined, null, or invalid
      throw new Error("[SessionManager]: Invalid session configuration provided.");
    }

    // Ensure this.session is not undefined or null after assignment
    if (!this.session) {
      throw new Error("[SessionManager]: Session initialization failed.");
    }
  } 

  public serializeUser(callback: (user: any) => any) {
    if (typeof callback !== "function") {
      throw new Error("[SessionManager]: serializeUser callback must be a function.");
    }
    this.session.serializeUser = callback;
  }

  public deserializeUser(callback: (id: string) => Promise<Express.User | null>) {
    if (typeof callback !== "function") {
      throw new Error("[SessionManager]: deserializeUser callback must be a function.");
    }
    this.session.deserializeUser = callback;
  }

  public manageSession() {
    return this.session.manageSession.bind(this.session);
  }

  public initialize() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.login = async (user) => {
        if (!req.session) return;
        await req.session.create(user);
      };

      req.logout = async () => {
        if (!req.session) return;
        await req.session.destroy();
      };

      req.isAuthenticated = () => !!req.session.user;
      next();
    };
  }
}
