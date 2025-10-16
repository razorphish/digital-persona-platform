"""
RDS Scheduler Lambda Function
Starts and stops RDS clusters on a schedule to save costs
"""

import json
import boto3
import os
from datetime import datetime

rds = boto3.client('rds')

def lambda_handler(event, context):
    """
    Main Lambda handler for RDS scheduling
    
    Event should contain:
    {
        "action": "start" or "stop",
        "cluster_identifier": "dev-dev01-dpp-cluster"
    }
    """
    
    action = event.get('action', 'unknown')
    cluster_id = event.get('cluster_identifier', os.environ.get('CLUSTER_ID'))
    
    if not cluster_id:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'No cluster_identifier provided'
            })
        }
    
    print(f"Processing {action} for cluster: {cluster_id}")
    
    try:
        # Get current cluster status
        response = rds.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        if not response['DBClusters']:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': f'Cluster {cluster_id} not found'
                })
            }
        
        cluster = response['DBClusters'][0]
        current_status = cluster['Status']
        
        print(f"Current status: {current_status}")
        
        if action == 'start':
            if current_status == 'stopped':
                rds.start_db_cluster(DBClusterIdentifier=cluster_id)
                message = f"Started cluster {cluster_id}"
                print(message)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': message,
                        'previous_status': current_status,
                        'action': 'start'
                    })
                }
            else:
                message = f"Cluster {cluster_id} is already {current_status}, no action needed"
                print(message)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': message,
                        'status': current_status,
                        'action': 'none'
                    })
                }
                
        elif action == 'stop':
            if current_status == 'available':
                rds.stop_db_cluster(DBClusterIdentifier=cluster_id)
                message = f"Stopped cluster {cluster_id}"
                print(message)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': message,
                        'previous_status': current_status,
                        'action': 'stop'
                    })
                }
            else:
                message = f"Cluster {cluster_id} is {current_status}, cannot stop"
                print(message)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': message,
                        'status': current_status,
                        'action': 'none'
                    })
                }
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': f'Invalid action: {action}. Must be "start" or "stop"'
                })
            }
            
    except Exception as e:
        error_message = f"Error processing {action} for {cluster_id}: {str(e)}"
        print(error_message)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message
            })
        }


