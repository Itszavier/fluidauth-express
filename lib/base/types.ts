/** @format */
import { Response, Request, CookieOptions } from "express";

export interface ErrorInfo {
  code: number;
  message: string;
  name: string;
}

export type SerializeUserFunction = (user: Express.User) => any;

export type DeserializeUserFunction = (id: string) => Express.User | null;

/**
 * Interface for managing session data and operations.
 * Uses a generic to allow dynamic typing and inference of additional properties.
 */
export interface ISession {
  create: (userData: Express.User) => Promise<void> | void;
  destroy: () => Promise<void> | void;
  user?: Express.User | null;
  cookie?: CookieOptions | null;
  [key: string]: any;
}

export interface ISessionData {
  sessionId: string;
  userId: string;
  expires: Date;
}

declare global {
  namespace Express {
    interface Request {
      session: ISession;
      user: Express.User;

      /**
       * Logs in a user using the user data directly from the database.
       * Skips the verification process and creates a session for the user.
       * @param userData - The user data from the database.
       */
      login: (
        request: any,
        response: any,
        userData:any
      ) => Promise<void>;

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

    interface User {
      // Add any additional properties for the user object if needed
    }
  }
}
