import fs from "fs";
import { db } from "./index.js";
import { getPasswordHash } from "../utils.js";
import { v4 as uuid } from "uuid";

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
        id, user_id, name, age, bio, gender,  looking_for, 
        latitude, longitude, profile_image, 
        created_at, updated_at
      ) VALUES (
        @id, @user_id, @name, @age, @bio, @gender, @looking_for,
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
  await seedUsers();
  await seedProfiles();
}
await main();
