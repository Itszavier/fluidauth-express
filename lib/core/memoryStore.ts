/** @format */

import { ISessionData } from "../base";
import { BaseSessionStore } from "../base/baseSessionStore";

export class MemoryStore extends BaseSessionStore {
  db: Map<string, ISessionData> = new Map();

  async create(sessionData: ISessionData) {
    this.db.set(sessionData.sessionId, sessionData);
  }

  async delete(sessionId: string): Promise<void> {
    const result = this.db.delete(sessionId);
  }

  async get(sessionId: string): Promise<ISessionData | null> {
    const sessionData = this.db.get(sessionId) || null;

    return sessionData;
  }

  async clean(): Promise<void> {}
}
