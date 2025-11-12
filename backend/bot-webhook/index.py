import json
import os
import time
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor, Json

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def log_event(cur, user_id, event_type, event_data, response_time_ms=None, success=True, error_message=None):
    '''Логирует событие в таблицу event_logs'''
    cur.execute(
        "INSERT INTO event_logs (user_id, event_type, event_data, response_time_ms, success, error_message) VALUES (" + 
        str(user_id) + ", '" + event_type + "', '" + json.dumps(event_data).replace("'", "''") + "', " + 
        (str(response_time_ms) if response_time_ms else 'NULL') + ", " + str(success) + ", " + 
        ("'" + error_message.replace("'", "''") + "'" if error_message else 'NULL') + ")"
    )

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Receives dialog data from Telegram bot and stores in database
    Args: event - dict with httpMethod, body (JSON with user_id, telegram_id, name, tokens, model, premium)
          context - object with request_id attribute
    Returns: HTTP response dict with success/error status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        start_time = time.time()
        body_data = json.loads(event.get('body', '{}'))
        
        telegram_id = body_data.get('telegram_id')
        name = body_data.get('name', 'Пользователь')
        username = body_data.get('username')
        tokens = body_data.get('tokens', 0)
        model = body_data.get('model', 'GPT-3.5')
        premium = body_data.get('premium', False)
        email = body_data.get('email')
        user_message = body_data.get('user_message')
        assistant_message = body_data.get('assistant_message')
        interaction_type = body_data.get('interaction_type', 'chat')
        
        if not telegram_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'telegram_id is required'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT id, total_tokens, dialogs_count FROM users WHERE telegram_id = " + str(telegram_id)
        )
        user = cur.fetchone()
        
        if user:
            user_id = user['id']
            new_total_tokens = user['total_tokens'] + tokens
            new_dialogs_count = user['dialogs_count'] + 1
            
            cur.execute(
                "UPDATE users SET total_tokens = " + str(new_total_tokens) + ", dialogs_count = " + str(new_dialogs_count) + ", last_active = '" + datetime.now().isoformat() + "', premium = " + str(premium) + ", username = '" + (username.replace("'", "''") if username else '') + "' WHERE id = " + str(user_id)
            )
        else:
            cur.execute(
                "INSERT INTO users (telegram_id, name, username, email, premium, total_tokens, dialogs_count, last_active) VALUES (" + str(telegram_id) + ", '" + name.replace("'", "''") + "', '" + (username.replace("'", "''") if username else '') + "', " + ("'" + email.replace("'", "''") + "'" if email else 'NULL') + ", " + str(premium) + ", " + str(tokens) + ", 1, '" + datetime.now().isoformat() + "') RETURNING id"
            )
            user_id = cur.fetchone()['id']
        
        cur.execute(
            "INSERT INTO dialogs (user_id, telegram_id, username, tokens, model, status, user_message, assistant_message, interaction_type, created_at, updated_at) VALUES (" + str(user_id) + ", " + str(telegram_id) + ", '" + (username.replace("'", "''") if username else '') + "', " + str(tokens) + ", '" + model.replace("'", "''") + "', 'Завершён', " + ("'" + user_message.replace("'", "''") + "'" if user_message else 'NULL') + ", " + ("'" + assistant_message.replace("'", "''") + "'" if assistant_message else 'NULL') + ", '" + interaction_type.replace("'", "''") + "', '" + datetime.now().isoformat() + "', '" + datetime.now().isoformat() + "') RETURNING id"
        )
        dialog_id = cur.fetchone()['id']
        
        today = datetime.now().date()
        cur.execute(
            "SELECT id, total_tokens, active_users FROM token_stats WHERE date = '" + str(today) + "'"
        )
        stats = cur.fetchone()
        
        if stats:
            cur.execute(
                "UPDATE token_stats SET total_tokens = total_tokens + " + str(tokens) + " WHERE date = '" + str(today) + "'"
            )
        else:
            cur.execute(
                "SELECT COUNT(DISTINCT telegram_id) as count FROM dialogs WHERE DATE(created_at) = '" + str(today) + "'"
            )
            active_count = cur.fetchone()['count']
            
            cur.execute(
                "INSERT INTO token_stats (date, total_tokens, active_users) VALUES ('" + str(today) + "', " + str(tokens) + ", " + str(active_count) + ")"
            )
        
        response_time_ms = int((time.time() - start_time) * 1000)
        
        log_event(
            cur, 
            user_id, 
            'message_received',
            {
                'user_message': user_message[:100] if user_message else None,
                'assistant_message': assistant_message[:100] if assistant_message else None,
                'tokens': tokens,
                'model': model
            },
            response_time_ms=response_time_ms,
            success=True
        )
        
        if user_message:
            cur.execute(
                "INSERT INTO messages (user_id, message, sender, timestamp) VALUES (" + 
                str(telegram_id) + ", '" + user_message.replace("'", "''") + "', 'user', '" + 
                datetime.now().isoformat() + "')"
            )
        
        if assistant_message:
            cur.execute(
                "INSERT INTO messages (user_id, message, sender, timestamp) VALUES (" + 
                str(telegram_id) + ", '" + assistant_message.replace("'", "''") + "', 'bot', '" + 
                datetime.now().isoformat() + "')"
            )
        
        if tokens > 0:
            cur.execute(
                "INSERT INTO costs (user_id, tokens_used, date) VALUES (" + 
                str(telegram_id) + ", " + str(tokens) + ", '" + str(datetime.now().date()) + "')"
            )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'dialog_id': dialog_id,
                'user_id': user_id
            }),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'status': 'Bot webhook API is running'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }