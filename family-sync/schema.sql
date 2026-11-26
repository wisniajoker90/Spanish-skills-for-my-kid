CREATE TABLE IF NOT EXISTS families (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id), name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('parent','learner')), token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, last_seen_at INTEGER, revoked_at INTEGER);
CREATE INDEX IF NOT EXISTS devices_by_family ON devices(family_id);
CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id), name TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, snapshot_json TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL, updated_by_device_id TEXT REFERENCES devices(id));
CREATE INDEX IF NOT EXISTS profiles_by_family ON profiles(family_id);
CREATE TABLE IF NOT EXISTS pairing_codes (code_hash TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id), created_by_device_id TEXT NOT NULL REFERENCES devices(id), created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER);
