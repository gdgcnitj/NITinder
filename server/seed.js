import { db } from "./db.js";
import { getPasswordHash } from "./utils.js";

function setupTables() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )`);
  db.exec(`
  CREATE TABLE IF NOT EXISTS sessions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    expired INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  console.log("[LOG] tables created");
}
async function seedUsers() {
  try {
    const select = db.prepare(`SELECT COUNT(*) AS user_count FROM users`);

    if (select.get()["user_count"] === 0) {
      const users = [
        {
          name: "John Doe",
          email: "john@doe.com",
          password: await getPasswordHash("john_password"),
        },
        {
          name: "Jane Doe",
          email: "jane@doe.com",
          password: await getPasswordHash("jane_password"),
        },
        {
          name: "Juan Rodriguez",
          email: "juan@rodri.com",
          password: await getPasswordHash("juan_password"),
        },
      ];

      const insert = db.prepare(
        `INSERT INTO users(name, email, password)
       VALUES (@name, @email, @password)`,
      );
      const insertUsers = db.transaction((users) => {
        for (let user of users) insert.run(user);
      });
      insertUsers(users);
    }

    console.log("[LOG] `users` table seeded");
  } catch (error) {
    console.error(`[ERROR] seeding users: ${error}`);
    throw error;
  }
}
async function main() {
  setupTables();
  await seedUsers();
}
await main();
