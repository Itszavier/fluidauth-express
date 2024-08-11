/** @format */

import { ISession } from "./base";

declare global {
  namespace Express {
    interface Request {
      session?: Partial<ISession>;
      user: Express.User;
    }

    interface User {}
  }
}
