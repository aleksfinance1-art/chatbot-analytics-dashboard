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
    Business: Returns token usage and costs for today
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response dict with token stats and cost in USD
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
            "SELECT SUM(tokens_used) as total, SUM(cost_dollars) as cost FROM costs WHERE date = '" + str(today) + "'"
        )
        
        result = cur.fetchone()
        total_tokens = int(result['total']) if result and result['total'] else 0
        total_cost = float(result['cost']) if result and result['cost'] else 0.0
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'date': str(today),
                'total_tokens': total_tokens,
                'cost_usd': round(total_cost, 4)
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
