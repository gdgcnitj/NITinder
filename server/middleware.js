import "dotenv/config";

import jwt from "jsonwebtoken";
import { db } from "./db/index.js";

const ALGORITHM = process.env.ALGORITHM ?? "HS256";
const SECRET_KEY = process.env.SECRET_KEY ?? "SECRET_KEY";

const publicRoutes = [
  { method: "GET", path: "/" },
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/register" },
];

/**
 * Determines whether the incoming request targets a public route
 * that does not require authentication.
 *
 * A route is considered public if its HTTP method and path match
 * one of the entries in the publicRoutes list. Nested paths under
 * a public route (e.g. /auth/login/something) are also treated as public.
 *
 * @param {import("express").Request} req - The Express request object.
 * @returns {boolean} True if the route is public and should bypass auth.
 */
function isPublicRoute(req) {
  const fullPath = req.path;

  return publicRoutes.some(
    (route) =>
      route.method === req.method &&
      (fullPath === route.path || fullPath.startsWith(`${route.path}/`)),
  );
}

/**
 * Authentication middleware that validates JWT tokens for protected routes.
 *
 * Allows requests to public routes without authentication. For protected routes,
 * validates the Bearer token in the Authorization header and attaches the decoded
 * payload to the request object.
 *
 * @param {Object} req - Express request object
 * @param {string} req.path - The request path
 * @param {string} req.method - The HTTP method (GET, POST, etc.)
 * @param {Function} req.get - Express method to get a header value
 * @param {Object} res - Express response object
 * @param {Function} res.status - Sets the HTTP status code
 * @param {Function} res.json - Sends a JSON response
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() on success or sends error response
 *
 * @throws {Object} Returns 401 JSON response if:
 *   - Authorization header is missing or malformed
 *   - Bearer scheme is not used
 *   - Token is invalid or expired
 *
 * @example
 * app.use(authMiddleware);
 */
export function authMiddleware(req, res, next) {
  if (isPublicRoute(req)) {
    return next();
  }

  const authHeader = req.get("Authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");

  if (!authHeader || scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ detail: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY, {
      algorithms: [ALGORITHM],
    });
    const session = db
      .prepare(
        `SELECT id, revoked_at, expires_at
         FROM sessions
         WHERE id = @session_id AND user_id = @user_id`,
      )
      .get(payload);

    if (!session) {
      throw new Error("Invalid session token");
    }

    if (session.revoked_at) {
      throw new Error("Revoked session token");
    }

    if (session.expires_at) {
      const expiresAtMs = Date.parse(session.expires_at);
      if (Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now()) {
        throw new Error("Expired session token");
      }
    }
    req.session = payload;
    return next();
  } catch (error) {
    console.error(`[ERROR] ${error}`);
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

export default authMiddleware;
