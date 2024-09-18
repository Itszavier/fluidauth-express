/** @format */
import { Response, Request, CookieOptions } from "express";
export interface ErrorInfo {
  code: number;
  message: string;
  name: string;
}

export interface IAuthResponse {
  info?: { message: string; code: number; name?: string };
  user: Express.User | null;
}

export type VerifyUserFunctionReturnType = Promise<IAuthResponse> | IAuthResponse;

export type SerializeUserFunction = (user: Express.User) => any;

export type DeserializeUserFunction = (id: string) => Promise<Express.User | null>;

export interface IHandleCallbackOption {
  middleware?: boolean;
}

/**
 * Interface for managing session data and operations.
 * Uses a generic to allow dynamic typing and inference of additional properties.
 */
export interface ISession {
  create: (userData: any) => Promise<void> | void;
  destroy: () => Promise<void> | void;
  clean: () => Promise<void> | void;
  delete: (sessionid: string) => Promise<void> | void;
  state: {
    [key: string]: any;
  };
  user: Express.User | null;
  cookie: CookieOptions | null;
  [key: string]: any;
}

export interface ISessionData {
  sessionId: string;
  userId: string;
  expires: string;
}

declare global {
  namespace Express {
    interface Request {
      session: ISession;
      user: Express.User | null;

      /**
       * Logs in a user using the user data directly from the database.
       * Skips the verification process and creates a session for the user.
       * @param userData - The user data from the database.
       */
      login: (userData: any) => Promise<void>;

      /**
       * Log out the user by destroying the session.
       * @param req - The Express request object.
       * @param res - The Express response object.
       */
      logout: () => Promise<void>;

      /**
       * Check if the user is authenticated by checking the session.
       */
      isAuthenticated: (req: Request) => boolean;
    }

    interface User {}
  }
}

export type TRedirectType = "login" | "logout";
export type TShouldRedirectFunction = (type: TRedirectType) => boolean;
export type TRedirectFunction = (response: Response, type: TRedirectType, success?: boolean) => void;
