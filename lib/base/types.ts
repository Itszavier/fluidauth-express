/** @format */

import { verify } from "jsonwebtoken";

export interface ErrorInfo {
  code: number;
  message: string;
  name: string;
}

export type DoneFunction = (
  error?: null,
  user?: Express.User,
  info?: ErrorInfo | null
) => void;

export interface VerifyAsyncReturnType {
  user: Express.User | null;
  info: Partial<ErrorInfo> | null;
}
