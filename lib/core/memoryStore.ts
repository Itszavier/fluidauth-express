/** @format */

import { FluidAuthError } from "../core/Error";
import { ISessionData } from "../base";
import { BaseSessionStore } from "../base/baseSessionStore";

export class MemoryStore extends BaseSessionStore {
  db: Map<string, ISessionData> = new Map();

  async create(sessionData: ISessionData) {
    if (this.db.has(sessionData.sessionId)) {
      throw new FluidAuthError({
        message: "Failed to create session with that ID Session already exist",
        code: 400,
      });
    }

    this.db.set(sessionData.sessionId, sessionData);
  }

  update(sessionId: string, sessionData: ISessionData): void {
    this.db.set(sessionId, sessionData);
  }

  async delete(sessionId: string): Promise<void> {
    const result = this.db.delete(sessionId);
  }

  async get(sessionId: string): Promise<ISessionData | null> {
    const sessionData = this.db.get(sessionId) || null;
    return sessionData;
  }

  async clean(): Promise<void> {
    for (const [sessionId, sessionData] of this.db) {
      const expiresTime = new Date(sessionData.expires).getTime();

      // Check if the expiration date is valid and whether it has expired
      const isExpired = expiresTime <= Date.now();
      const isInvalidDate = isNaN(expiresTime);

      if (isInvalidDate || isExpired) {
        this.db.delete(sessionId);
      }
    }
  }
}
