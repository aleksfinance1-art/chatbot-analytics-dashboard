import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Returns full conversation history for a specific user
    Args: event - dict with httpMethod, queryStringParameters (telegram_id or user_id)
          context - object with request_id attribute
    Returns: HTTP response dict with user info and all their messages
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        telegram_id = params.get('telegram_id')
        user_id = params.get('user_id')
        
        if not telegram_id and not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'telegram_id or user_id is required'}),
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if telegram_id:
            cur.execute(
                "SELECT id, telegram_id, name, username, email, total_tokens, dialogs_count, premium, last_active FROM users WHERE telegram_id = " + str(telegram_id)
            )
        else:
            cur.execute(
                "SELECT id, telegram_id, name, username, email, total_tokens, dialogs_count, premium, last_active FROM users WHERE id = " + str(user_id)
            )
        
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        user_data = dict(user)
        moscow_tz = timezone(timedelta(hours=3))
        utc_time = user_data['last_active'].replace(tzinfo=timezone.utc)
        moscow_time = utc_time.astimezone(moscow_tz)
        user_data['lastActive'] = moscow_time.strftime('%d.%m.%Y %H:%M')
        del user_data['last_active']
        
        cur.execute(
            "SELECT id, tokens, model, status, user_message, assistant_message, interaction_type, created_at FROM dialogs WHERE user_id = " + str(user_data['id']) + " ORDER BY created_at ASC"
        )
        dialogs = [dict(row) for row in cur.fetchall()]
        
        for dialog in dialogs:
            utc_time = dialog['created_at'].replace(tzinfo=timezone.utc)
            moscow_time = utc_time.astimezone(moscow_tz)
            dialog['date'] = moscow_time.strftime('%d.%m.%Y %H:%M')
            del dialog['created_at']
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': user_data,
                'dialogs': dialogs,
                'total_messages': len(dialogs)
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }