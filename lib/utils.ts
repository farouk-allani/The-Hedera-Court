import { clsx, type ClassValue } from "clsx";
import { createHash, randomBytes } from "crypto";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function createCaseId() {
  return `case_${randomBytes(4).toString("base64url")}`;
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function isMockHederaAllowed() {
  return (
    process.env.HEDERA_ALLOW_MOCK === "true" ||
    !process.env.HEDERA_OPERATOR_ID ||
    !process.env.HEDERA_OPERATOR_KEY
  );
}
