-- Добавляем поля для хранения полной переписки и username
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);

ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS user_message TEXT;
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS assistant_message TEXT;
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(50) DEFAULT 'chat';

-- Создаём индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_dialogs_username ON dialogs(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_dialogs_interaction_type ON dialogs(interaction_type);

