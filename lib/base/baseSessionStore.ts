/** @format */

import { ISessionData } from "./types";

/** @format */
export abstract class BaseSessionStore {
  abstract db: unknown;

  constructor() {}
  /**
   * Creates a session with the provided data.
   *
   * @param {SessionData} sessionData - Data for the new session.
   * @returns {Promise<void> | void} A promise that resolves when the session is created, or nothing if synchronous.
   */
  abstract create(sessionData: ISessionData): Promise<void> | void;

  /**
   * Deletes the session with the specified ID.
   *
   * @param {string} sessionId - The ID of the session to delete.
   * @returns {Promise<void> | void} A promise that resolves when the session is deleted, or nothing if synchronous.
   */
  abstract delete(sessionId: string): Promise<void> | void;

  /**
   * Retrieves the session data for the given ID.
   *
   * @param {string} sessionId - The ID of the session to retrieve.
   * @returns {Promise<ISessionData | null> | (ISessionData | null)} A promise that resolves with the session data or `null` if not found, or the data directly if synchronous.
   */
  abstract get(
    sessionId: string
  ): Promise<ISessionData | null> | (ISessionData | null);

  /**
   * Cleans up old or unused data.
   *
   * @returns {void | Promise<void>} A promise that resolves when the cleanup is done, or nothing if synchronous.
   */
  abstract clean(): void | Promise<void>;
}
