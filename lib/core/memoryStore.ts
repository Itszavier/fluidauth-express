/** @format */

import { ISessionData } from "../base";
import { BaseSessionStore } from "../base/baseSessionStore";

export class MemoryStore extends BaseSessionStore {
  db: Map<string, ISessionData> = new Map();

  async create(sessionData: ISessionData) {
    console.log(`[Debug]: Creating session with ID: ${sessionData.sessionId}`);
    this.db.set(sessionData.sessionId, sessionData);
    console.log(`[Debug]: Session created: ${JSON.stringify(sessionData)}`);
  }

  async delete(sessionId: string): Promise<void> {
    console.log(`[Debug]: Deleting session with ID: ${sessionId}`);
    const result = this.db.delete(sessionId);
    console.log(`[Debug]: Session deleted: ${result}`);
  }

  async get(sessionId: string): Promise<ISessionData | null> {
    console.log(`[Debug]: Retrieving session with ID: ${sessionId}`);

    console.log("session store:", this.db);
    const sessionData = this.db.get(sessionId) || null;
    if (sessionData) {
      console.log(`[Debug]: Session data retrieved: ${JSON.stringify(sessionData)}`);
    } else {
      console.log(`[Debug]: No session data found for ID: ${sessionId}`);
    }
    return sessionData;
  }

  async clean(): Promise<void> {}
}
