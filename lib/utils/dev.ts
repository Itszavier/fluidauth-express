/** @format */

import crypto from "crypto";

function deriveKey(secret: string, length: number): Buffer {
  return crypto.createHash("sha256").update(secret).digest().slice(0, length);
}

export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16); // 16 bytes IV for AES
  const key = deriveKey(secret, 32); // Use a 32-byte key for AES-256

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Combine IV with the encrypted text for later use
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string, secret: string): string {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts.shift() as string, "hex");

  if (iv.length !== 16) {
    throw new Error("Invalid IV length. IV must be 16 bytes long.");
  }

  const encrypted = parts.join(":");
  const key = deriveKey(secret, 32); // Use a 32-byte key for AES-256

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
