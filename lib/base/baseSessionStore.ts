/** @format */
export interface SessionData {
  sessionId: string;
  user: string;
  expires: Date;
}

export abstract class BaseSessionStore {
  abstract db: unknown;

  constructor() {}

  abstract create(sessionData: SessionData): Promise<void> | void;

  abstract delete(sessionId: string): Promise<void> | void;

  abstract get(sessionId: string): Promise<SessionData | null> | (SessionData | null);
}
