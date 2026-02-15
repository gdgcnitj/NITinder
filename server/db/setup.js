import { db } from "./index.js";

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

function setupTriggers() {
  db.exec(`CREATE TRIGGER IF NOT EXISTS match_on_mutual_swipe
  AFTER INSERT ON swipes
  FOR EACH ROW
  WHEN NEW.direction = 'R'
  BEGIN
    INSERT OR IGNORE INTO matches (id, user1_id, user2_id, created_at)
    SELECT 
      lower(hex(randomblob(16))),
      CASE WHEN NEW.swiper_id < NEW.swipee_id THEN NEW.swiper_id ELSE NEW.swipee_id END,
      CASE WHEN NEW.swiper_id < NEW.swipee_id THEN NEW.swipee_id ELSE NEW.swiper_id END,
      datetime('now')
    WHERE EXISTS (
      SELECT 1 FROM swipes 
      WHERE swiper_id = NEW.swipee_id 
      AND swipee_id = NEW.swiper_id 
      AND direction = 'R'
    );
  END`);
  console.log("[LOG] triggers created");
}

function setupIndexes() {
  // Users indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

  // Sessions indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`,
  );

  // Profiles indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_profiles_geo ON profiles(latitude, longitude)`,
  );

  // Conversations indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON conversations(match_id)`,
  );

  // Messages indexes
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at)`,
  );
  db.exec(
    `CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)`,
  );

  console.log("[LOG] indexes created");
}

function main() {
  setupTables();
  setupTriggers();
  setupIndexes();
}
main();
