import "dotenv/config";

import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { db } from "./db.js";

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
    const isVerified = argon2.verify(hashedPassword, plainPassword);
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
  const session = db
    .prepare(`INSERT INTO sessions (user_id) VALUES (@user_id) RETURNING id`)
    .get({ user_id: user.id });
  const accessToken = jwt.sign(
    { username: user.name, user_id: user.id, session_id: session.id },
    SECRET_KEY,
    {
      algorithm: ALGORITHM,
    },
  );
  return accessToken;
}

export { getPasswordHash, verifyPasswordHash, createAccessToken };
