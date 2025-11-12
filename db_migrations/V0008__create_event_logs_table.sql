-- Таблица для логирования всех событий системы
CREATE TABLE IF NOT EXISTS event_logs (
  id SERIAL PRIMARY KEY,
  user_id BIGINT,
  event_type VARCHAR(50) NOT NULL, -- message_sent, api_call, error, backup, response
  event_data JSONB, -- Гибкое хранение данных события
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
CREATE INDEX idx_event_logs_timestamp ON event_logs(timestamp);
CREATE INDEX idx_event_logs_success ON event_logs(success);
CREATE INDEX idx_event_logs_data ON event_logs USING GIN(event_data);