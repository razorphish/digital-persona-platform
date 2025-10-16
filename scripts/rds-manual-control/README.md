# RDS Manual Control Scripts

**Save $165/month** by stopping the dev RDS cluster when not in use!

## 🎯 Quick Start

### Stop RDS (end of day):
```bash
# PowerShell (Windows)
.\stop-dev-rds.ps1

# Bash (Mac/Linux/WSL)
./stop-dev-rds.sh
```

### Start RDS (beginning of day):
```bash
# PowerShell (Windows)
.\start-dev-rds.ps1

# Bash (Mac/Linux/WSL)
./start-dev-rds.sh
```

### Check Status:
```bash
# PowerShell (Windows)
.\status-dev-rds.ps1
```

## 💰 Cost Savings

| Scenario | Monthly Cost | Savings |
|----------|--------------|---------|
| **Running 24/7** | $215/month | $0 |
| **Manual control (50 hrs/week)** | $50/month | **$165/month** ✨ |
| **Automated scheduler** | $50/month | **$165/month** 🎯 |

## ⏱️ Time to Start/Stop

- **Stop command:** Instant (takes 2-5 minutes to fully stop)
- **Start command:** Instant (takes 2-5 minutes to fully start)
- **Your time:** 30 seconds per day

## 📅 Recommended Schedule

**For maximum savings, stop RDS when:**
- End of work day (6 PM)
- Weekends
- Holidays
- When not actively developing

**Start RDS when:**
- Beginning of work day (8 AM)
- When needed for development
- For meetings/demos

## 🔧 Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **RDS permissions** (you should already have these):
   - `rds:DescribeDBClusters`
   - `rds:StartDBCluster`
   - `rds:StopDBCluster`

## 🎓 Usage Tips

### Daily Routine
```bash
# Morning: Start RDS
.\start-dev-rds.ps1

# ... work all day ...

# Evening: Stop RDS
.\stop-dev-rds.ps1
```

### Check Before Weekend
```bash
# Friday evening
.\status-dev-rds.ps1
.\stop-dev-rds.ps1  # If running
```

### Emergency Start
If you need to work after hours:
```bash
.\start-dev-rds.ps1
# Wait 2-5 minutes
# Start working
```

## 🚨 Important Notes

1. **Automatic Snapshots**: Still happen even when stopped (no data loss)
2. **No Downtime Risk**: Your data is safe, just the cluster is paused
3. **Quick Restart**: Takes only 2-5 minutes to become available
4. **No Manual Work Needed**: Once automated scheduler is deployed, these scripts are optional

## 🎯 Migration Path

**Current State** (Today):
- Use these scripts manually
- Savings: $165/month
- Time: 30 seconds per day

**Future State** (After IAM permissions):
- Deploy automated scheduler
- Savings: $165/month
- Time: 0 seconds per day (fully automatic!)

## 📊 Tracking Your Savings

Keep track in your calendar or notebook:
```
Week 1: Stopped 5 nights = saved ~$40
Week 2: Stopped 5 nights = saved ~$40
Week 3: Stopped 5 nights = saved ~$40
Week 4: Stopped 5 nights = saved ~$40
---
Monthly savings: ~$165
```

## 🔗 Related Files

- `DEPLOYMENT_BLOCKED_IAM_ISSUE.md` - How to get automated scheduler
- `PHASE_2_DEPLOYMENT_GUIDE.md` - Automated scheduler deployment
- `COST_OPTIMIZATION_STATUS.md` - Overall optimization status

---

**Pro Tip**: Set a calendar reminder at 6 PM to run the stop script! 🔔


