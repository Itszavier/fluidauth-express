/** @format */

import { verify } from "jsonwebtoken";

export interface ErrorInfo {
  code: number;
  message: string;
  name: string;
}

export interface VerifyAsyncReturnType {
  user: Express.User | null;
  info: Partial<ErrorInfo> | null;
}
