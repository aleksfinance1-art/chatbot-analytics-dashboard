import json
import os
from datetime import date
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Returns average response quality for today (% of messages >50 chars)
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response dict with quality percentage and date
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
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        today = date.today()
        
        cur.execute(
            "SELECT COUNT(*) FILTER (WHERE LENGTH(message) > 50) * 100.0 / NULLIF(COUNT(*), 0) as quality_pct " +
            "FROM messages WHERE DATE(timestamp) = '" + str(today) + "' AND sender = 'bot'"
        )
        
        result = cur.fetchone()
        quality = result['quality_pct'] if result and result['quality_pct'] else 0
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'quality': round(float(quality), 2),
                'date': str(today)
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
