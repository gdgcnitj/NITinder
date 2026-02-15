import "dotenv/config";

import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";

import { db } from "./db/index.js";

const ALGORITHM = process.env.ALGORITHM ?? "HS256";
const SECRET_KEY = process.env.SECRET_KEY ?? "SECRET_KEY";

/**
 * Hashes a plain text password using Argon2 algorithm.
 * @async
 * @param {string} plainPassword - The plain text password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} Throws an error if hashing fails.
 */
async function getPasswordHash(plainPassword) {
  try {
    const hashedPassword = await argon2.hash(plainPassword);
    return hashedPassword;
  } catch (error) {
    console.log(`Unexpected error while hashing: ${error}`);
    throw error;
  }
}

/**
 * Verifies a plain text password against a hashed password using Argon2.
 * @async
 * @param {string} hashedPassword - The hashed password to verify against.
 * @param {string} plainPassword - The plain text password to verify.
 * @returns {Promise<boolean>} A promise that resolves to true if the password matches, false otherwise.
 * @throws {Error} Throws an error if verification fails.
 */
async function verifyPasswordHash(hashedPassword, plainPassword) {
  try {
    const isVerified = await argon2.verify(hashedPassword, plainPassword);
    return isVerified;
  } catch (error) {
    console.log(`Unexpected error while hashing: ${error}`);
    throw error;
  }
}

/**
 * Creates an access token for a user using JWT.
 * @async
 * @param {Object} user - The user object containing user information.
 * @returns {string} A promise that resolves to the JWT access token.
 */
function createAccessToken(user) {
  const sessionId = uuid();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const accessToken = jwt.sign(
    { username: user.email, user_id: user.id, session_id: sessionId },
    SECRET_KEY,
    {
      algorithm: ALGORITHM,
    },
  );

  db.prepare(
    `INSERT INTO sessions (id, user_id, session_token, created_at, expires_at, revoked_at)
     VALUES (@id, @user_id, @session_token, @created_at, @expires_at, NULL)`
  ).run({
    id: sessionId,
    user_id: user.id,
    session_token: accessToken,
    created_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return accessToken;
}

export { getPasswordHash, verifyPasswordHash, createAccessToken };
