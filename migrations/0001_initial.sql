CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL,
  lng REAL,
  avatar_b64 TEXT,
  is_donor INTEGER NOT NULL DEFAULT 1,
  is_available INTEGER NOT NULL DEFAULT 1,
  is_admin INTEGER NOT NULL DEFAULT 0,
  donations_count INTEGER NOT NULL DEFAULT 0,
  lives_saved INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL DEFAULT 'Volunteer',
  last_donation_at TEXT,
  joined_at TEXT NOT NULL
);

CREATE TABLE blood_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id),
  patient_name TEXT NOT NULL,
  blood_type TEXT NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  hospital TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL,
  lng REAL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  fulfilled_at TEXT
);

CREATE TABLE donations (
  id TEXT PRIMARY KEY,
  donor_id TEXT NOT NULL REFERENCES users(id),
  request_id TEXT REFERENCES blood_requests(id),
  units INTEGER NOT NULL DEFAULT 1,
  hospital TEXT NOT NULL,
  donated_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE request_responses (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES blood_requests(id),
  donor_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  responded_at TEXT NOT NULL
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL REFERENCES users(id),
  to_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT NOT NULL
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_requests_blood ON blood_requests(blood_type, status);
CREATE INDEX idx_requests_city ON blood_requests(city, status);
CREATE INDEX idx_requests_requester ON blood_requests(requester_id);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_responses_request ON request_responses(request_id);
CREATE INDEX idx_messages_from ON messages(from_id);
CREATE INDEX idx_messages_to ON messages(to_id);
CREATE INDEX idx_notifs_user ON notifications(user_id, read);
