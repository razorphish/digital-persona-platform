# Cost Monitoring System

## 🎯 Overview

The Hibiji platform includes a comprehensive cost monitoring system designed to provide real-time visibility into AWS spending, automated alerts, and cost optimization recommendations.

## 📊 System Components

### 1. **Terraform Cost Control Module**

- **Location**: `terraform/modules/cost-control/main.tf`
- **Features**:
  - Environment-specific budgets (dev: $50, qa: $100, staging: $200, prod: $1000)
  - Sub-environment budgets (dev01: $20, qa01: $50, etc.)
  - Service-specific cost thresholds
  - Cost anomaly detection
  - CloudWatch dashboards
  - SNS notifications

### 2. **GitHub Actions Cost Monitor**

- **Location**: `.github/workflows/cost-monitor.yml`
- **Features**:
  - Daily cost analysis (9 AM UTC)
  - Weekly cost summaries (Sundays)
  - Monthly cost reports (1st of month)
  - Budget status monitoring
  - Cost optimization recommendations
  - Automated alerts

### 3. **CloudWatch Cost Dashboard**

- **Location**: `monitoring/grafana/dashboards/cost-dashboard.json`
- **Features**:
  - Real-time cost trends
  - Service breakdowns
  - Budget utilization tracking
  - Cost anomaly detection
  - Resource utilization metrics

### 4. **Cost Optimization Script**

- **Location**: `scripts/cost-optimization.sh`
- **Features**:
  - Automated resource analysis
  - Unused resource detection
  - Cost optimization recommendations
  - Detailed reports with savings estimates

## 🚀 Quick Start

### 1. **Deploy Cost Monitoring Infrastructure**

```bash
# Navigate to your environment
cd terraform/environments/dev

# Apply the cost control module
terraform apply -var="alert_emails=['your-email@domain.com']"
```

### 2. **Run Cost Optimization Analysis**

```bash
# Run the cost optimization script
./scripts/cost-optimization.sh
```

### 3. **Access Cost Dashboard**

```bash
# Get the dashboard URL
terraform output cost_dashboard_url
```

### 4. **Manual Cost Report**

```bash
# Trigger manual cost analysis via GitHub Actions
# Go to Actions > Cost Monitor > Run workflow
```

## 📈 Budget Configuration

### Environment Budgets

| Environment | Monthly Budget | Daily Threshold | Alert Emails |
| ----------- | -------------- | --------------- | ------------ |
| dev         | $50            | $2.50 (5%)      | ✅           |
| qa          | $100           | $5.00 (5%)      | ✅           |
| staging     | $200           | $10.00 (5%)     | ✅           |
| hotfix      | $150           | $7.50 (5%)      | ✅           |
| prod        | $1000          | $50.00 (5%)     | ✅           |

### Sub-Environment Budgets

| Sub-Environment | Monthly Budget | Parent Environment |
| --------------- | -------------- | ------------------ |
| dev01           | $20            | dev                |
| dev02           | $20            | dev                |
| dev03           | $20            | dev                |
| qa01            | $50            | qa                 |
| qa02            | $50            | qa                 |
| qa03            | $50            | qa                 |
| staging01       | $100           | staging            |
| staging02       | $100           | staging            |
| staging03       | $100           | staging            |
| hotfix01        | $75            | hotfix             |
| hotfix02        | $75            | hotfix             |
| hotfix03        | $75            | hotfix             |

### Service-Specific Budgets

| Service | Percentage | Description             |
| ------- | ---------- | ----------------------- |
| ECS     | 40%        | Container compute costs |
| RDS     | 30%        | Database costs          |
| ALB     | 10%        | Load balancer costs     |
| Storage | 10%        | S3 and EBS costs        |
| Other   | 10%        | Miscellaneous costs     |

## 🔔 Alert Configuration

### Budget Alerts

The system provides three types of budget alerts:

1. **Actual Cost Alerts**: Triggered when actual spending exceeds budget
2. **Forecasted Cost Alerts**: Triggered when forecasted spending exceeds 80% of budget
3. **Daily Cost Alerts**: Triggered when daily spending exceeds 5% of monthly budget

### Alert Channels

- **Email**: Direct notifications to specified email addresses
- **SNS**: AWS Simple Notification Service for integration with other systems
- **GitHub Actions**: Automated reports and artifact uploads

### Alert Thresholds

| Alert Type      | Threshold            | Frequency |
| --------------- | -------------------- | --------- |
| Actual Cost     | 100% of budget       | Real-time |
| Forecasted Cost | 80% of budget        | Daily     |
| Daily Cost      | 5% of monthly budget | Daily     |
| Cost Anomaly    | 10% increase         | Daily     |

## 📊 Dashboard Features

### Cost Overview Panels

1. **Monthly Cost Trend**: Historical cost data over time
2. **Daily Cost Breakdown**: Daily spending patterns
3. **Cost by Service**: Service-wise cost distribution
4. **Cost by Environment**: Environment-wise cost allocation

### Budget Tracking Panels

1. **Budget vs Actual**: Current month spending vs budget
2. **Budget Utilization %**: Percentage of budget used
3. **Forecasted Cost**: Predicted end-of-month costs
4. **Cost Anomaly Score**: Unusual spending patterns

### Service-Specific Panels

1. **EC2 Cost Trend**: Compute costs over time
2. **RDS Cost Trend**: Database costs over time
3. **S3 Cost Trend**: Storage costs over time
4. **Load Balancer Cost Trend**: ALB costs over time

### Optimization Panels

1. **Cost Optimization Recommendations**: Actionable suggestions
2. **Budget Alerts**: Active budget notifications
3. **Cost Efficiency Metrics**: Resource utilization scores
4. **Resource Utilization**: Average resource usage

## 🔧 Configuration

### Terraform Variables

```hcl
variable "alert_emails" {
  description = "Email addresses for cost alerts"
  type        = list(string)
  default     = ["admin@hibiji.com"]
}
```

### GitHub Actions Secrets

```bash
# Required secrets for cost monitoring
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/GitHubActionsRole
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...  # Optional
```

### Environment Variables

```bash
# Script configuration
AWS_REGION=us-west-1
PROJECT_TAG=hibiji
```

## 📋 Cost Optimization Recommendations

### Immediate Actions (High Impact)

1. **Delete Unused Resources**

   - Unused EBS volumes
   - Inactive ECS services
   - Stopped RDS instances
   - Unused security groups

2. **Optimize Instance Sizes**

   - Review actual resource usage
   - Downsize over-provisioned instances
   - Use auto-scaling for variable workloads

3. **Implement Lifecycle Policies**
   - S3 object lifecycle management
   - EBS snapshot cleanup
   - CloudWatch log retention

### Medium-Term Actions

1. **Reserved Instances**

   - Purchase RIs for predictable workloads
   - Use Savings Plans for flexible commitments
   - Consider Spot instances for non-production

2. **Storage Optimization**

   - Use appropriate S3 storage classes
   - Implement data lifecycle policies
   - Compress data where possible

3. **Database Optimization**
   - Use RDS Aurora for better cost efficiency
   - Implement connection pooling
   - Optimize query performance

### Long-Term Actions

1. **Architecture Optimization**

   - Consider serverless alternatives
   - Implement caching strategies
   - Use CDN for static content

2. **Multi-Region Strategy**
   - Evaluate multi-region deployment costs
   - Implement cost-effective disaster recovery
   - Use regional pricing differences

## 🚨 Troubleshooting

### Common Issues

#### 1. **Budget Alerts Not Working**

```bash
# Check budget configuration
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text)

# Check SNS topic
aws sns list-topics --query 'Topics[?contains(TopicArn, `cost-alerts`)]'
```

#### 2. **Cost Dashboard Not Loading**

```bash
# Check CloudWatch dashboard
aws cloudwatch list-dashboards --dashboard-name-prefix hibiji-cost

# Verify metrics
aws cloudwatch list-metrics --namespace AWS/Billing
```

#### 3. **GitHub Actions Failing**

```bash
# Check workflow logs
# Go to Actions > Cost Monitor > View logs

# Verify AWS credentials
aws sts get-caller-identity
```

### Debug Commands

```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost

# Check budget status
aws budgets describe-budgets \
  --account-id $(aws sts get-caller-identity --query Account --output text)

# Check cost anomalies
aws ce get-anomalies \
  --anomaly-monitor-arn arn:aws:ce:us-west-1:ACCOUNT:anomalymonitor/hibiji-cost-anomaly-monitor
```

## 📈 Best Practices

### 1. **Regular Monitoring**

- Review cost reports daily
- Analyze weekly summaries
- Conduct monthly deep-dive reviews
- Schedule quarterly cost optimization sessions

### 2. **Proactive Management**

- Set up budget alerts before deployment
- Monitor cost trends during development
- Implement cost gates in CI/CD pipelines
- Regular resource cleanup

### 3. **Team Awareness**

- Share cost reports with the team
- Include cost considerations in design reviews
- Train developers on cost optimization
- Establish cost ownership per environment

### 4. **Continuous Improvement**

- Track cost optimization metrics
- Measure savings from recommendations
- Update budgets based on actual usage
- Refine alert thresholds

## 🔗 Integration Points

### Slack Integration

```yaml
# Add to GitHub Actions workflow
- name: Send Slack notification
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"🚨 AWS Cost Alert: Budget threshold exceeded!"}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

### PagerDuty Integration

```yaml
# Add to GitHub Actions workflow
- name: Create PagerDuty incident
  run: |
    curl -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Token token=${{ secrets.PAGERDUTY_TOKEN }}" \
      -d '{"incident":{"type":"incident","title":"AWS Cost Alert","service":{"id":"SERVICE_ID","type":"service_reference"}}}' \
      https://api.pagerduty.com/incidents
```

### Email Integration

```hcl
# Add to Terraform configuration
resource "aws_ses_email_identity" "cost_alerts" {
  email = "cost-alerts@yourdomain.com"
}
```

## 📚 Additional Resources

### AWS Documentation

- [AWS Cost Explorer](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)
- [AWS Budgets](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/budgets-managing-costs.html)
- [AWS Cost Anomaly Detection](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-anomalies.html)

### Cost Optimization Tools

- [AWS Cost Optimization Hub](https://aws.amazon.com/cost-optimization/)
- [AWS Trusted Advisor](https://aws.amazon.com/premiumsupport/technology/trusted-advisor/)
- [AWS Compute Optimizer](https://aws.amazon.com/compute-optimizer/)

### Monitoring Tools

- [CloudWatch Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html)
- [Grafana AWS Integration](https://grafana.com/docs/grafana/latest/datasources/aws-cloudwatch/)
- [Prometheus AWS Exporter](https://github.com/prometheus/cloudwatch_exporter)

---

**Status**: ✅ **IMPLEMENTED**  
**Last Updated**: January 2025  
**Version**: 1.0
