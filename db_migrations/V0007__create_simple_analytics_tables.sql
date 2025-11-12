-- Таблица 1: users (упрощенная)
CREATE TABLE IF NOT EXISTS users_simple (
  user_id BIGINT PRIMARY KEY,
  username VARCHAR(255),
  first_message_date TIMESTAMP,
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active'
);

-- Таблица 2: messages (упрощенная)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  message TEXT,
  sender VARCHAR(10), -- user/bot
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quality_score DECIMAL(2,1) CHECK (quality_score >= 1 AND quality_score <= 5)
);

-- Таблица 3: costs (упрощенная)
CREATE TABLE IF NOT EXISTS costs (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  tokens_used INTEGER,
  cost_dollars DECIMAL(10, 6),
  date DATE DEFAULT CURRENT_DATE
);

-- Таблица 4: ratings (упрощенная)
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  date DATE DEFAULT CURRENT_DATE
);

-- Создаем индексы
CREATE INDEX idx_users_simple_status ON users_simple(status);
CREATE INDEX idx_users_simple_utm ON users_simple(utm_source);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_costs_user_id ON costs(user_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_date ON ratings(date);

-- Переносим данные из users_enhanced в users_simple
INSERT INTO users_simple (user_id, username, first_message_date, utm_source, utm_campaign, status)
SELECT 
  telegram_user_id as user_id,
  username,
  first_seen as first_message_date,
  utm_source,
  utm_campaign,
  status
FROM users_enhanced;

-- Переносим данные из conversations в messages
INSERT INTO messages (user_id, message, sender, timestamp)
SELECT 
  user_id,
  message_text as message,
  sender,
  timestamp
FROM conversations;

-- Переносим данные из token_usage в costs
INSERT INTO costs (user_id, tokens_used, cost_dollars, date)
SELECT 
  user_id,
  total_tokens as tokens_used,
  cost_usd as cost_dollars,
  DATE(timestamp) as date
FROM token_usage;