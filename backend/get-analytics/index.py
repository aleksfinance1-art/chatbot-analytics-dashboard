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
    Business: Returns analytics data (dialogs, users, token stats) for dashboard
    Args: event - dict with httpMethod, queryStringParameters (days, filter_model, filter_status)
          context - object with request_id attribute
    Returns: HTTP response dict with analytics data
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
        days = int(params.get('days', 7))
        filter_model = params.get('model', 'all')
        filter_status = params.get('status', 'all')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT COUNT(*) as count FROM users")
        total_users = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM users WHERE premium = true")
        premium_users = cur.fetchone()['count']
        
        cur.execute("SELECT COUNT(*) as count FROM dialogs WHERE status = 'Активный'")
        active_dialogs = cur.fetchone()['count']
        
        cur.execute("SELECT COALESCE(SUM(total_tokens), 0) as total FROM users")
        total_tokens = cur.fetchone()['total']
        
        start_date = datetime.now().date() - timedelta(days=days-1)
        cur.execute(
            "SELECT date, total_tokens, active_users FROM token_stats WHERE date >= '" + str(start_date) + "' ORDER BY date"
        )
        token_stats = [dict(row) for row in cur.fetchall()]
        
        for stat in token_stats:
            stat['date'] = stat['date'].strftime('%d.%m')
        
        dialog_query = "SELECT d.id, u.name as user, u.username, d.telegram_id, d.created_at, d.tokens, d.model, d.status, u.premium, d.user_message, d.assistant_message, d.interaction_type FROM dialogs d JOIN users u ON d.user_id = u.id WHERE 1=1"
        query_params = []
        
        if filter_model != 'all':
            dialog_query += " AND d.model = %s"
            query_params.append(filter_model)
        
        if filter_status != 'all':
            dialog_query += " AND d.status = %s"
            query_params.append(filter_status)
        
        dialog_query += " ORDER BY d.created_at DESC LIMIT 100"
        
        if query_params:
            for param in query_params:
                dialog_query = dialog_query.replace('%s', "'" + param.replace("'", "''") + "'", 1)
        cur.execute(dialog_query)
        dialogs = [dict(row) for row in cur.fetchall()]
        
        moscow_tz = timezone(timedelta(hours=3))
        for dialog in dialogs:
            utc_time = dialog['created_at'].replace(tzinfo=timezone.utc)
            moscow_time = utc_time.astimezone(moscow_tz)
            dialog['date'] = moscow_time.strftime('%d.%m.%Y %H:%M')
            del dialog['created_at']
        
        cur.execute("SELECT id, telegram_id, name, username, email, total_tokens, dialogs_count, premium, last_active FROM users ORDER BY total_tokens DESC")
        users = [dict(row) for row in cur.fetchall()]
        
        for user in users:
            utc_time = user['last_active'].replace(tzinfo=timezone.utc)
            moscow_time = utc_time.astimezone(moscow_tz)
            user['lastActive'] = moscow_time.strftime('%d.%m.%Y')
            del user['last_active']
        
        cur.execute(
            "SELECT model, COUNT(*) as count FROM dialogs GROUP BY model"
        )
        model_stats = [dict(row) for row in cur.fetchall()]
        
        total_dialogs = sum(stat['count'] for stat in model_stats)
        model_distribution = []
        for stat in model_stats:
            percentage = round((stat['count'] / total_dialogs * 100) if total_dialogs > 0 else 0)
            model_distribution.append({
                'name': stat['model'],
                'value': percentage,
                'count': stat['count']
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'summary': {
                    'totalUsers': total_users,
                    'premiumUsers': premium_users,
                    'activeDialogs': active_dialogs,
                    'totalTokens': total_tokens
                },
                'tokenStats': token_stats,
                'dialogs': dialogs,
                'users': users,
                'modelDistribution': model_distribution
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }