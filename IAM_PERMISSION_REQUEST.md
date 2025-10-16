# IAM Permission Request - Cost Optimization Infrastructure

**Requested by:** dev-airica  
**Date:** October 16, 2025  
**Purpose:** Deploy automated RDS scheduler for cost optimization  
**Estimated Savings:** $165/month ($1,980/year)

---

## 📋 Executive Summary

We've completed Phase 1 of AWS cost optimization (saving $60/month) and are ready to deploy Phase 2 (automated RDS scheduler). This requires additional IAM permissions to create Lambda functions and EventBridge rules.

**Key Benefits:**
- ✅ Automated cost savings: $165/month
- ✅ Infrastructure as Code (Terraform)
- ✅ Scoped to dev-* resources only (safe)
- ✅ No manual intervention needed once deployed

---

## 🎯 What We're Building

An automated RDS scheduler that:
1. **Stops** dev RDS cluster at 6 PM PST (Mon-Fri)
2. **Starts** dev RDS cluster at 8 AM PST (Mon-Fri)
3. Runs on weekdays only (50 hours/week vs 168 hours/week)
4. Reduces RDS costs from $215/month to $50/month

**Technology Stack:**
- AWS Lambda (Python 3.11)
- EventBridge (scheduled rules)
- CloudWatch Logs
- Terraform (Infrastructure as Code)

---

## 🔐 IAM Permissions Requested

### Required Permissions for: `arn:aws:iam::570827307849:user/dev-airica`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowDevIAMRoleManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:GetRole",
        "iam:DeleteRole",
        "iam:TagRole",
        "iam:UntagRole",
        "iam:PutRolePolicy",
        "iam:GetRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::570827307849:role/dev-*",
        "arn:aws:iam::570827307849:role/qa-*",
        "arn:aws:iam::570827307849:role/staging-*"
      ]
    },
    {
      "Sid": "AllowDevLambdaManagement",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:GetFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:GetPolicy",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:ListTags"
      ],
      "Resource": [
        "arn:aws:lambda:*:570827307849:function:dev-*",
        "arn:aws:lambda:*:570827307849:function:qa-*",
        "arn:aws:lambda:*:570827307849:function:staging-*"
      ]
    },
    {
      "Sid": "AllowDevEventBridgeManagement",
      "Effect": "Allow",
      "Action": [
        "events:PutRule",
        "events:DeleteRule",
        "events:DescribeRule",
        "events:EnableRule",
        "events:DisableRule",
        "events:PutTargets",
        "events:RemoveTargets",
        "events:ListTargetsByRule",
        "events:TagResource",
        "events:UntagResource",
        "events:ListTagsForResource"
      ],
      "Resource": [
        "arn:aws:events:*:570827307849:rule/dev-*",
        "arn:aws:events:*:570827307849:rule/qa-*",
        "arn:aws:events:*:570827307849:rule/staging-*"
      ]
    },
    {
      "Sid": "AllowDevCloudWatchLogsManagement",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:TagResource",
        "logs:UntagResource",
        "logs:ListTagsForResource"
      ],
      "Resource": [
        "arn:aws:logs:*:570827307849:log-group:/aws/lambda/dev-*",
        "arn:aws:logs:*:570827307849:log-group:/aws/lambda/qa-*",
        "arn:aws:logs:*:570827307849:log-group:/aws/lambda/staging-*"
      ]
    }
  ]
}
```

---

## 🔒 Security Considerations

### Why These Permissions Are Safe:

1. **Scoped to Non-Production Only**
   - Only affects `dev-*`, `qa-*`, and `staging-*` resources
   - **Production is excluded** (no `prod-*` resources)

2. **Specific Resource Types**
   - Limited to Lambda, IAM roles, EventBridge, and CloudWatch Logs
   - Cannot modify EC2, S3, databases, or other critical resources

3. **Principle of Least Privilege**
   - Only actions needed for Terraform deployment
   - No wildcard (*) resources for sensitive operations

4. **Auditable & Reversible**
   - All changes tracked in Terraform state
   - Can be rolled back with `terraform destroy`
   - CloudTrail logs all actions

5. **Time-Limited Request**
   - Once infrastructure is deployed, these permissions are rarely needed
   - Can be reviewed/revoked after initial deployment if desired

---

## 📊 Business Case

### Current State (Phase 1 Complete):
- Cleaned up old snapshots: **$15/month saved**
- Deleted unused secrets: **$4.40/month saved**
- Reduced backup retention: **$40/month saved**
- **Total Phase 1: $60/month = $720/year**

### Proposed State (Phase 2):
- Automated RDS scheduling: **$165/month saved**
- Combined with Phase 1: **$225/month = $2,700/year**
- **ROI: Immediate** (no infrastructure costs)

### Long-Term Value:
- Infrastructure as Code enables faster development
- Automated cost controls reduce manual oversight
- Best practices for cloud resource management
- Foundation for future optimizations (Phase 3+)

---

## 🛠️ Implementation Plan

### Once Permissions Are Granted:

**Step 1: Deploy Infrastructure (5 minutes)**
```bash
cd terraform/environments/dev
terraform init
terraform apply -target=module.rds_scheduler
```

**Step 2: Verify Deployment (2 minutes)**
```bash
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'dev-rds-scheduler')]"
aws events list-rules --name-prefix dev-
```

**Step 3: Monitor First Week**
- Check CloudWatch Logs for successful executions
- Verify RDS starts/stops on schedule
- Measure cost savings in Cost Explorer

---

## 📈 Success Metrics

### Week 1:
- ✅ Lambda functions execute successfully
- ✅ RDS cluster stops/starts automatically
- ✅ No manual intervention needed

### Month 1:
- ✅ $165/month cost reduction visible in AWS billing
- ✅ Zero operational issues
- ✅ Team satisfaction (no manual stop/start needed)

### Year 1:
- ✅ $1,980 total savings
- ✅ Infrastructure foundation for additional optimizations
- ✅ Proven ROI for Infrastructure as Code approach

---

## 📚 Documentation Provided

All implementation details are documented:

1. **COST_OPTIMIZATION_STATUS.md** - Complete project status
2. **PHASE_2_DEPLOYMENT_GUIDE.md** - Step-by-step deployment
3. **DEPLOYMENT_BLOCKED_IAM_ISSUE.md** - Detailed technical explanation
4. **terraform/modules/rds-scheduler/** - Complete Terraform code

---

## 🤝 Alternative Approach (If Denied)

If these permissions cannot be granted, we can:

1. **Option A**: Admin-led deployment
   - AWS admin deploys using provided Terraform code
   - One-time 15-minute effort
   - Same $165/month savings

2. **Option B**: Manual control
   - Use provided scripts to manually stop/start RDS
   - Still saves $165/month
   - Requires daily 30-second action

3. **Option C**: Hybrid approach
   - Manual control now (immediate savings)
   - Automated deployment later (when convenient)

---

## ✅ Approval Request

**Requesting approval for:**
- IAM permissions detailed above
- Scope: dev/qa/staging environments only
- Purpose: Cost optimization infrastructure
- Expected deployment: Within 1 week of approval

**Approved by:** _________________________  
**Date:** _________________________  
**Notes:** _________________________

---

## 📞 Questions?

**Technical Contact:** dev-airica  
**Documentation:** See attached files in repository  
**Terraform Code:** `terraform/modules/rds-scheduler/`

---

**Thank you for considering this request!** 🙏

The cost savings and automation benefits will significantly improve our AWS resource management.



