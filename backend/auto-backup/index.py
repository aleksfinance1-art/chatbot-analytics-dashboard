import json
import os
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Creates daily backup of database statistics and logs the event
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response dict with backup status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET' or method == 'POST':
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT COUNT(*) as count FROM users_simple")
        users_count = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM messages")
        messages_count = cur.fetchone()['count']
        
        cur.execute("SELECT SUM(tokens_used) as total FROM costs")
        total_tokens = cur.fetchone()['total'] or 0
        
        cur.execute("SELECT SUM(cost_dollars) as total FROM costs")
        total_cost = cur.fetchone()['total'] or 0
        
        cur.execute("SELECT COUNT(*) as count FROM event_logs")
        logs_count = cur.fetchone()['count']
        
        backup_data = {
            'backup_date': str(datetime.now().date()),
            'users_count': users_count,
            'messages_count': messages_count,
            'total_tokens': int(total_tokens),
            'total_cost_usd': float(total_cost),
            'logs_count': logs_count
        }
        
        cur.execute(
            "INSERT INTO event_logs (user_id, event_type, event_data, success) VALUES (NULL, 'backup_created', '" + 
            json.dumps(backup_data).replace("'", "''") + "', true)"
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'backup_data': backup_data,
                'message': 'Backup completed successfully'
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
