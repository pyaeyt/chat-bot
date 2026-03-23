import type { Request, Response, NextFunction } from "express";
import type { Role } from "./db.js";
import { verifyToken } from "./auth.js";
import { findUserById } from "./db.js";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; role: Role; displayName: string };
}

function extractBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token." });
    return;
  }
  const row = findUserById(payload.sub);
  if (!row) {
    res.status(401).json({ error: "User no longer exists." });
    return;
  }
  if (row.email.toLowerCase() !== payload.email.toLowerCase() || row.role !== payload.role) {
    res.status(401).json({ error: "Token out of date. Please sign in again." });
    return;
  }
  req.user = {
    id: row.id,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
  };
  next();
}

export function requireRole(...allowed: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have permission for this action." });
      return;
    }
    next();
  };
}
