-- Создаем новую расширенную таблицу users_enhanced с аналитикой
CREATE TABLE IF NOT EXISTS users_enhanced (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- active, banned, premium
  premium_until TIMESTAMP,
  
  -- Источник трафика
  utm_source VARCHAR(100), -- yandex_direct, telegram, organic
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  yclid VARCHAR(255),
  
  -- Фиксируем первый вопрос
  first_question_category VARCHAR(50), -- productivity, learning, creative, health, business
  first_question_text TEXT,
  
  -- Статистика
  total_messages_count INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0
);

-- Переносим существующие данные из старой таблицы users
INSERT INTO users_enhanced (telegram_user_id, username, first_seen, last_seen, status, total_tokens_used)
SELECT 
  telegram_id,
  username,
  created_at as first_seen,
  last_active as last_seen,
  CASE 
    WHEN premium = true THEN 'premium'
    ELSE 'active'
  END as status,
  COALESCE(total_tokens, 0) as total_tokens_used
FROM users
WHERE telegram_id IS NOT NULL;

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_users_enhanced_telegram_id ON users_enhanced(telegram_user_id);
CREATE INDEX idx_users_enhanced_status ON users_enhanced(status);
CREATE INDEX idx_users_enhanced_utm_source ON users_enhanced(utm_source);
CREATE INDEX idx_users_enhanced_first_seen ON users_enhanced(first_seen);
CREATE INDEX idx_users_enhanced_premium_until ON users_enhanced(premium_until);