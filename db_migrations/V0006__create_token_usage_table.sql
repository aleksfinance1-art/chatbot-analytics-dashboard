-- Создаем таблицу token_usage для детального учета токенов по каждому запросу
CREATE TABLE IF NOT EXISTS token_usage (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  model VARCHAR(50), -- gpt-4, gpt-3.5-turbo, claude-3
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10, 6),
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users_enhanced(telegram_user_id)
);

-- Создаем индексы для аналитики
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_model ON token_usage(model);
CREATE INDEX idx_token_usage_timestamp ON token_usage(timestamp);
CREATE INDEX idx_token_usage_success ON token_usage(success);
CREATE INDEX idx_token_usage_cost ON token_usage(cost_usd);

-- Переносим существующие данные из таблицы dialogs
INSERT INTO token_usage (user_id, model, total_tokens, timestamp, success)
SELECT 
  telegram_id as user_id,
  model,
  tokens as total_tokens,
  created_at as timestamp,
  CASE 
    WHEN status = 'Активный' THEN TRUE
    ELSE FALSE
  END as success
FROM dialogs
WHERE telegram_id IS NOT NULL AND tokens > 0;