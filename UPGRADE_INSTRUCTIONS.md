# Инструкция по обновлению дашборда для отображения переписки

## Что было сделано

1. **Добавлена миграция базы данных** (`db_migrations/V0002__add_dialog_content.sql`)
   - Добавлены поля: `username`, `user_message`, `assistant_message`, `interaction_type`
   - Созданы индексы для быстрого поиска

2. **Обновлён backend** (`backend/bot-webhook/index.py`)
   - Теперь принимает и сохраняет username, текст сообщений пользователя и бота
   - Все данные записываются в таблицы `users` и `dialogs`

## Как применить изменения

### Шаг 1: Примените миграцию базы данных

Зайдите в вашу PostgreSQL базу данных (например, через psql или через панель Poehali) и выполните:

```sql
-- Из файла db_migrations/V0002__add_dialog_content.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);

ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS username VARCHAR(255);
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS user_message TEXT;
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS assistant_message TEXT;
ALTER TABLE dialogs ADD COLUMN IF NOT EXISTS interaction_type VARCHAR(50) DEFAULT 'chat';

CREATE INDEX IF NOT EXISTS idx_dialogs_username ON dialogs(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_dialogs_interaction_type ON dialogs(interaction_type);
```

### Шаг 2: Обновите backend на Poehali

1. Зайдите в https://poehali.dev/project/67316cc0b59e540013cdaa39
2. Откройте функцию `bot-webhook` (Functions → bot-webhook)
3. Замените код на обновлённую версию из `backend/bot-webhook/index.py`
4. Сохраните и задеплойте

### Шаг 3: Обновите get-analytics функцию

Добавьте новые поля в SQL-запрос:

```python
# В backend/get-analytics/index.py
# Замените запрос dialogs на:
cur.execute("""
    SELECT 
        d.id,
        u.name as user,
        u.username,
        d.telegram_id,
        TO_CHAR(d.created_at, 'DD.MM.YYYY HH24:MI') as date,
        d.tokens,
        d.model,
        d.status,
        u.premium,
        d.user_message,
        d.assistant_message,
        d.interaction_type
    FROM dialogs d
    JOIN users u ON d.user_id = u.id
    ORDER BY d.created_at DESC
    LIMIT 100
""")
```

### Шаг 4: Обновите Frontend

В файле `src/pages/Index.tsx` добавьте колонки для отображения переписки:

```tsx
// Добавьте в таблицу диалогов новые колонки:
<TableHead>Username</TableHead>
<TableHead>Сообщение пользователя</TableHead>
<TableHead>Ответ бота</TableHead>

// И в TableRow:
<TableCell>@{dialog.username || 'N/A'}</TableCell>
<TableCell className="max-w-xs truncate">{dialog.user_message || '-'}</TableCell>
<TableCell className="max-w-xs truncate">{dialog.assistant_message || '-'}</TableCell>
```

### Шаг 5: Протестируйте

1. Напишите сообщение боту в Telegram
2. Подождите 5-10 секунд
3. Обновите дашборд
4. Проверьте, что видны:
   - Username (логин в Telegram)
   - Текст вопроса пользователя
   - Текст ответа бота

## Что отправляется от бота

Бот теперь отправляет полные данные:

```json
{
  "telegram_id": 123456789,
  "name": "Иван Петров",
  "username": "ivan_petrov",
  "tokens": 1500,
  "model": "openai/gpt-4.1-mini",
  "premium": false,
  "email": null,
  "user_message": "Привет! Как начать копить?",
  "assistant_message": "Здравствуйте! Рад помочь...",
  "interaction_type": "chat"
}
```

## Troubleshooting

Если данные не появляются:
1. Проверьте логи бота: `tail -50 bot.log | grep HTTP`
2. Убедитесь, что миграция применена: `SELECT column_name FROM information_schema.columns WHERE table_name = 'dialogs';`
3. Проверьте, что backend-функция обновлена и задеплоена
4. Откройте консоль браузера (F12) и проверьте, что API возвращает новые поля

