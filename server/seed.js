import fs from "fs";
import { db } from "./db.js";
import { getPasswordHash } from "./utils.js";
import { v4 as uuid } from "uuid";

function setupTables() {
  db.exec(`CREATE TABLE IF NOT EXISTS users(
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT,
  deleted_at    TEXT
)`);
  db.exec(`
CREATE TABLE IF NOT EXISTS sessions(
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  session_token TEXT NOT NULL,
  created_at    TEXT,
  expires_at    TEXT,
  revoked_at    TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS profiles(
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT,
  age           INTEGER,
  bio           TEXT,
  gender        CHAR(1), -- 'M'(male) or 'F'(female)
  looking_for   CHAR(1), -- 'M'(male), 'F'(female) or 'A'(any)
  latitude      REAL,
  longitude     REAL,
  created_at    TEXT,
  updated_at    TEXT,
  profile_image TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS swipes(
  id         TEXT PRIMARY KEY,
  swiper_id  TEXT NOT NULL,
  swipee_id  TEXT NOT NULL,
  direction  CHAR(1), -- 'L'(left) or 'R'(right)
  created_at TEXT,
  FOREIGN KEY(swiper_id) REFERENCES users(id),
  FOREIGN KEY(swipee_id) REFERENCES users(id)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS matches(
  id TEXT PRIMARY KEY,
  user1_id TEXT NOT NULL,
  user2_id TEXT NOT NULL,
  created_at TEXT,
  FOREIGN KEY(user1_id) REFERENCES users(id),
  FOREIGN KEY(user2_id) REFERENCES users(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS conversations(
  id         TEXT PRIMARY KEY,
  match_id   TEXT NOT NULL,
  created_at TEXT,
  FOREIGN KEY(match_id) REFERENCES matches(id)
)`);
  db.exec(`CREATE TABLE IF NOT EXISTS messages(
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  content         TEXT,
  created_at      TEXT,
  deleted_at      TEXT,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id),
  FOREIGN KEY(sender_id)       REFERENCES users(id)
)`);
  console.log("[LOG] tables created");
}
async function seedUsers() {
  try {
    const select = db.prepare(`SELECT COUNT(*) AS user_count FROM users`);

    if (select.get()["user_count"] === 0) {
      const users = [
        {
          email: "john@doe.com",
          password_hash: await getPasswordHash("john_password"),
        },
        {
          email: "jane@doe.com",
          password_hash: await getPasswordHash("jane_password"),
        },
        {
          email: "juan@rodri.com",
          password_hash: await getPasswordHash("juan_password"),
        },
      ];

      const insert = db.prepare(
        `INSERT INTO users(id, email, password_hash, created_at, deleted_at)
         VALUES (@id, @email, @password_hash, @created_at, NULL)`,
      );
      const insertUsers = db.transaction((users) => {
        for (let user of users)
          insert.run({
            id: uuid(),
            created_at: new Date().toISOString(),
            ...user,
          });
      });
      insertUsers(users);
    }

    console.log("[LOG] `users` table seeded");
  } catch (error) {
    console.error(`[ERROR] seeding users: ${error}`);
    throw error;
  }
}
async function seedProfiles() {
  try {
    const profiles = [
      {
        email: "john@doe.com",
        name: "John Doe",
        age: 42,
        gender: "M",
        looking_for: "F",
      },
      {
        email: "jane@doe.com",
        name: "Jane Doe",
        age: 23,
        gender: "F",
        looking_for: "M",
      },
      {
        email: "juan@rodri.com",
        name: "Juan Rodriguez",
        age: 25,
        gender: "M",
        looking_for: "A",
      },
    ];

    const select = db.prepare(`SELECT COUNT(*) AS profile_count FROM profiles`);
    if (select.get()["profile_count"] === 0) {
      const selectUserId = db.prepare(
        `SELECT id as user_id FROM users WHERE email = @email`,
      );
      const insert = db.prepare(
        `INSERT INTO profiles (
        id, user_id, age, bio, gender,  looking_for, 
        latitude, longitude, profile_image, 
        created_at, updated_at
      ) VALUES (
        @id, @user_id, @age, @bio, @gender, @looking_for,
        @latitude, @longitude, @profile_image,
        @created_at, @updated_at
      )`,
      );
      const insertProfiles = db.transaction((profiles) => {
        for (let profile of profiles) {
          const user_id = selectUserId.get({ email: profile.email })["user_id"];
          insert.run({
            id: uuid(),
            user_id,
            bio: "Lorem Ipsum",
            latitude: Math.random() * 180 - 90,
            longitude: Math.random() * 180,
            profile_image: fs.readFileSync(
              profile.gender === "M"
                ? "./static/img/placeholder-male.png"
                : "./static/img/placeholder-female.png",
            ),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...profile,
          });
        }
      });
      insertProfiles(profiles);
    }
    console.log("[LOG] `profiles` table seeded");
  } catch (error) {
    console.error(`[ERROR] seeding users: ${error}`);
    throw error;
  }
}
async function main() {
  setupTables();
  await seedUsers();
  await seedProfiles();
}
await main();
