/** @format */

import { Request, Response, NextFunction } from "express";
import { BaseProvider } from "../base/BaseProvider";

export class GoogleProvider extends BaseProvider {
  constructor() {
    super({
      name: "google",
      type: "OAuth2",
    });
  }

  async getUserInfo(AccessToken: string) {}

  async ExchangeCodeForToken(code: string) {}

  authenticate(req: Request, res: Response, next: NextFunction): void {}
}
