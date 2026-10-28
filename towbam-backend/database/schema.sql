-- TOWBAM — schéma PostgreSQL (équivalent des migrations Laravel).
-- Utile pour lire/relire le modèle ou initialiser une base sans Laravel.
-- Avec Laravel, utilisez plutôt : php artisan migrate --seed

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'reader',      -- reader | author | moderator | admin
  country VARCHAR(80), bio TEXT, link VARCHAR(255),
  suspended BOOLEAN NOT NULL DEFAULT FALSE,
  payout_method VARCHAR(40), payout_account VARCHAR(120),
  remember_token VARCHAR(100), created_at TIMESTAMP, updated_at TIMESTAMP
);
CREATE INDEX users_role_idx ON users(role);

CREATE TABLE genres (id BIGSERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE);

CREATE TABLE books (
  id BIGSERIAL PRIMARY KEY,
  author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre_id BIGINT REFERENCES genres(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL, language VARCHAR(20) NOT NULL,
  summary TEXT NOT NULL, excerpt TEXT,
  price NUMERIC(8,2) NOT NULL, excerpt_pct SMALLINT NOT NULL DEFAULT 10,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',     -- draft | pending | approved | refused | needs_changes
  rejection_reason TEXT, featured BOOLEAN NOT NULL DEFAULT FALSE,
  cover_path VARCHAR(255), file_path VARCHAR(255),
  published_at TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP
);
CREATE INDEX books_status_idx ON books(status);

CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(30) NOT NULL, method VARCHAR(20) NOT NULL,
  amount NUMERIC(10,2) NOT NULL, currency CHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending | paid | failed
  reference VARCHAR(255) NOT NULL UNIQUE, payload JSONB,
  created_at TIMESTAMP, updated_at TIMESTAMP
);

CREATE TABLE purchases (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  price NUMERIC(8,2) NOT NULL, author_amount NUMERIC(8,2) NOT NULL, platform_amount NUMERIC(8,2) NOT NULL,
  created_at TIMESTAMP, updated_at TIMESTAMP, UNIQUE (user_id, book_id)
);

CREATE TABLE library_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  created_at TIMESTAMP, UNIQUE (user_id, book_id)
);

CREATE TABLE follows (
  id BIGSERIAL PRIMARY KEY,
  follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP, UNIQUE (follower_id, author_id)
);

CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5), body TEXT,
  created_at TIMESTAMP, updated_at TIMESTAMP, UNIQUE (user_id, book_id)
);

CREATE TABLE author_balances (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0, total_earned NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE payout_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL, method VARCHAR(40) NOT NULL, account VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', paid_at TIMESTAMP,
  created_at TIMESTAMP, updated_at TIMESTAMP
);

CREATE TABLE moderation_logs (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  moderator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL, reason TEXT, created_at TIMESTAMP
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, message VARCHAR(255) NOT NULL,
  read_at TIMESTAMP, created_at TIMESTAMP
);

CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id BIGINT REFERENCES books(id) ON DELETE SET NULL,
  target VARCHAR(255) NOT NULL, message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP, updated_at TIMESTAMP
);

CREATE TABLE settings (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(120) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP, updated_at TIMESTAMP
);

INSERT INTO settings (key, value, created_at, updated_at) VALUES ('author_commission', '0.70', NOW(), NOW());

INSERT INTO genres (name) VALUES ('Roman'),('Nouvelles'),('Poésie'),('Essai'),('Conte'),('Science-fiction'),('Théâtre'),('Jeunesse');
