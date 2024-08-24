/** @format */
import { Response, Request, CookieOptions } from "express";

export interface ErrorInfo {
  code: number;
  message: string;
  name: string;
}

export type SerializeUserFunction = (user: Express.User) => any;

export type DeserializeUserFunction = (id: string) => any;

/**
 * Interface for managing session data and operations.
 * Uses a generic to allow dynamic typing and inference of additional properties.
 */
export interface ISession {
  create: (userData: Express.User) => Promise<void> | void;
  destroy: () => Promise<void> | void;
  user?: string | Express.User | null;
  cookie?: CookieOptions | null;
  [key: string]: any;
}

export interface ISessionData {
  sessionId: string;
  userId: string;
  expires: Date;
}
export interface VerifyAsyncReturnType {
  user: Express.User | null;
  info: Partial<ErrorInfo> | null;
}

declare global {
  namespace Express {
    interface Request {
      session: ISession;
      user: Express.User;
    }

    interface User {}
  }
}
