-- Переносим существующие вопросы из таблицы dialogs в conversations
INSERT INTO conversations (user_id, message_text, sender, timestamp)
SELECT 
  telegram_id as user_id,
  user_message as message_text,
  'user' as sender,
  created_at as timestamp
FROM dialogs
WHERE telegram_id IS NOT NULL AND user_message IS NOT NULL AND user_message != '';

-- Переносим существующие ответы из таблицы dialogs в conversations
INSERT INTO conversations (user_id, message_text, sender, timestamp)
SELECT 
  telegram_id as user_id,
  assistant_message as message_text,
  'bot' as sender,
  created_at as timestamp
FROM dialogs
WHERE telegram_id IS NOT NULL AND assistant_message IS NOT NULL AND assistant_message != '';