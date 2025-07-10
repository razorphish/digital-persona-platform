#!/usr/bin/env python3
"""
Script to check IAM permissions for the dev-airica user
Run this to see what policies are attached and identify the explicit deny
"""

import boto3
import json
from botocore.exceptions import ClientError

def check_user_policies(username):
    """Check all policies attached to a user"""
    iam = boto3.client('iam')
    
    print(f"🔍 Checking policies for user: {username}")
    print("=" * 50)
    
    try:
        # Get user info
        user_response = iam.get_user(UserName=username)
        user_arn = user_response['User']['Arn']
        print(f"User ARN: {user_arn}")
        print()
        
        # Get attached managed policies
        print("📋 MANAGED POLICIES:")
        print("-" * 30)
        managed_policies = iam.list_attached_user_policies(UserName=username)
        
        if not managed_policies['AttachedPolicies']:
            print("No managed policies attached")
        else:
            for policy in managed_policies['AttachedPolicies']:
                print(f"• {policy['PolicyName']} ({policy['PolicyArn']})")
                
                # Get policy document
                try:
                    policy_version = iam.get_policy(PolicyArn=policy['PolicyArn'])
                    default_version = policy_version['Policy']['DefaultVersionId']
                    policy_doc = iam.get_policy_version(
                        PolicyArn=policy['PolicyArn'],
                        VersionId=default_version
                    )
                    
                    # Check for ECR denies
                    check_policy_for_ecr_denies(policy_doc['PolicyVersion']['Document'], policy['PolicyName'])
                except ClientError as e:
                    print(f"  ⚠️  Could not retrieve policy document: {e}")
        
        print()
        
        # Get inline policies
        print("📋 INLINE POLICIES:")
        print("-" * 30)
        inline_policies = iam.list_user_policies(UserName=username)
        
        if not inline_policies['PolicyNames']:
            print("No inline policies attached")
        else:
            for policy_name in inline_policies['PolicyNames']:
                print(f"• {policy_name}")
                
                # Get policy document
                try:
                    policy_doc = iam.get_user_policy(
                        UserName=username,
                        PolicyName=policy_name
                    )
                    check_policy_for_ecr_denies(policy_doc['PolicyDocument'], policy_name)
                except ClientError as e:
                    print(f"  ⚠️  Could not retrieve policy document: {e}")
        
        print()
        
        # Check if user is in groups
        print("👥 USER GROUPS:")
        print("-" * 30)
        groups = iam.list_groups_for_user(UserName=username)
        
        if not groups['Groups']:
            print("User is not in any groups")
        else:
            for group in groups['Groups']:
                print(f"• {group['GroupName']}")
                
                # Check group policies
                group_policies = iam.list_attached_group_policies(GroupName=group['GroupName'])
                if group_policies['AttachedPolicies']:
                    print("  Managed policies:")
                    for policy in group_policies['AttachedPolicies']:
                        print(f"    - {policy['PolicyName']}")
                
                inline_group_policies = iam.list_group_policies(GroupName=group['GroupName'])
                if inline_group_policies['PolicyNames']:
                    print("  Inline policies:")
                    for policy_name in inline_group_policies['PolicyNames']:
                        print(f"    - {policy_name}")
        
        print()
        print("✅ Policy check complete!")
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchEntity':
            print(f"❌ User '{username}' not found")
        else:
            print(f"❌ Error checking user policies: {e}")

def check_policy_for_ecr_denies(policy_doc, policy_name):
    """Check if a policy document contains ECR deny statements"""
    if 'Statement' not in policy_doc:
        return
    
    for statement in policy_doc['Statement']:
        if statement.get('Effect') == 'Deny':
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
            
            ecr_denies = [action for action in actions if 'ecr:' in action]
            if ecr_denies:
                print(f"  🚨 DENY found in {policy_name}:")
                print(f"     Actions: {ecr_denies}")
                if 'Resource' in statement:
                    print(f"     Resources: {statement['Resource']}")
                print()

def test_ecr_permissions():
    """Test if the current credentials can access ECR"""
    print("🧪 TESTING ECR PERMISSIONS:")
    print("-" * 30)
    
    try:
        ecr = boto3.client('ecr')
        ecr.get_authorization_token()
        print("✅ ECR GetAuthorizationToken: SUCCESS")
    except ClientError as e:
        print(f"❌ ECR GetAuthorizationToken: FAILED")
        print(f"   Error: {e.response['Error']['Message']}")
        print(f"   Code: {e.response['Error']['Code']}")

if __name__ == "__main__":
    import sys
    
    username = "dev-airica"
    if len(sys.argv) > 1:
        username = sys.argv[1]
    
    print("🔧 IAM Permissions Checker")
    print("=" * 50)
    
    # Check if AWS credentials are configured
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"Using AWS Account: {identity['Account']}")
        print(f"Current User/Role: {identity['Arn']}")
        print()
    except Exception as e:
        print(f"❌ AWS credentials not configured: {e}")
        print("Please run: aws configure")
        sys.exit(1)
    
    # Check user policies
    check_user_policies(username)
    
    print()
    
    # Test ECR permissions
    test_ecr_permissions()
    
    print()
    print("📝 Next steps:")
    print("1. If you see ECR denies, remove them in the AWS Console")
    print("2. If no ECR permissions, add AmazonEC2ContainerRegistryPowerUser policy")
    print("3. Re-run your GitHub Actions workflow") 