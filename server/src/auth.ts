import jwt from "jsonwebtoken";
import type { Role } from "./db.js";

const JWT_SECRET =
  process.env.JWT_SECRET ?? "dev-only-change-me-use-env-JWT_SECRET-in-production";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export function signToken(userId: string, email: string, role: Role): string {
  return jwt.sign({ sub: userId, email, role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.sub || !decoded?.email || !decoded?.role) return null;
    return decoded;
  } catch {
    return null;
  }
}
