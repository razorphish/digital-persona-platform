# Quick Start Guide - AWS Cost Optimization

**You're all set!** Here's how to start saving money today. 💰

---

## 🚀 **START HERE - Today (30 seconds)**

### Stop RDS Tonight (Save $165/month)

**PowerShell (Windows):**
```powershell
cd scripts\rds-manual-control
.\stop-dev-rds.ps1
```

**Bash (Mac/Linux/WSL):**
```bash
cd scripts/rds-manual-control
./stop-dev-rds.sh
```

**Expected Output:**
```
[SUCCESS] Stop command sent!
Cluster will be fully stopped in 2-5 minutes.
Estimated savings: $165/month when stopped after hours
```

### Start RDS Tomorrow Morning

**PowerShell (Windows):**
```powershell
cd scripts\rds-manual-control
.\start-dev-rds.ps1
```

**Bash (Mac/Linux/WSL):**
```bash
cd scripts/rds-manual-control
./start-dev-rds.sh
```

**Expected Output:**
```
[SUCCESS] Start command sent!
Cluster will be fully available in 2-5 minutes.
```

---

## 📊 **Current Status (Your RDS Right Now)**

✅ **Cluster:** dev-dev01-dpp-cluster  
✅ **Status:** Available (RUNNING)  
✅ **Region:** us-west-1  
✅ **Backup Retention:** 3 days (optimized!)  
✅ **Capacity:** 0.5-1.0 ACUs

**Current cost:** ~$215/month (running 24/7)  
**Optimized cost:** ~$50/month (running business hours only)  
**Your savings:** **$165/month = $1,980/year** 🎉

---

## 📅 **Daily Routine (30 seconds per day)**

### Morning (8:00 AM):
```powershell
.\start-dev-rds.ps1
```
☕ Get coffee while it starts (2-5 minutes)

### Evening (6:00 PM):
```powershell
.\stop-dev-rds.ps1
```
💰 Money saved!

### Anytime (check status):
```powershell
.\status-dev-rds.ps1
```

---

## 📧 **Request Automation (5 minutes)**

Send the IAM permission request to your AWS admin:

1. **Open:** `IAM_PERMISSION_REQUEST.md`
2. **Review:** Complete business case included
3. **Send:** Email or Slack to your AWS administrator
4. **Subject:** "IAM Permission Request - Cost Optimization ($1,980/year savings)"

**What to say:**
> Hi [Admin Name],
> 
> I've completed Phase 1 of our AWS cost optimization (saving $60/month). 
> For Phase 2, I need IAM permissions to deploy an automated RDS scheduler 
> that will save an additional $165/month.
> 
> See the attached `IAM_PERMISSION_REQUEST.md` for the complete business 
> case and scoped IAM policy. The policy only affects dev/qa/staging 
> environments (production excluded).
> 
> Expected ROI: $1,980/year with zero manual effort after deployment.
> 
> Can you review and approve?
> 
> Thanks!

**Once approved:** The Terraform code is ready to deploy in 5 minutes.

---

## 💰 **Savings Summary**

| What | Status | Savings/Month | Savings/Year |
|------|--------|---------------|--------------|
| **Phase 1** | ✅ **LIVE** | **$60** | **$720** |
| Deleted old snapshots | ✅ Done | $15 | $180 |
| Deleted unused secrets | ✅ Done | $4.40 | $53 |
| Reduced backup retention | ✅ Done | $40 | $480 |
| | | | |
| **Phase 2** | ⏳ **Ready** | **$165** | **$1,980** |
| Manual RDS control | ⚡ Start today | $165 | $1,980 |
| Automated RDS scheduler | 🔒 Needs IAM | $165 | $1,980 |
| | | | |
| **TOTAL** | | **$225** | **$2,700** |

---

## 📚 **Documentation Reference**

### Quick Reference:
- **This file** (`QUICK_START_GUIDE.md`) - Start here!
- `scripts/rds-manual-control/README.md` - Detailed script documentation

### For Your AWS Admin:
- `IAM_PERMISSION_REQUEST.md` - Complete business case & IAM policy
- `DEPLOYMENT_BLOCKED_IAM_ISSUE.md` - Technical details

### Detailed Documentation:
- `COST_OPTIMIZATION_STATUS.md` - Complete project status
- `PHASE_2_DEPLOYMENT_GUIDE.md` - Automation deployment steps
- `AWS_COST_ANALYSIS_REPORT.md` - Original cost analysis

---

## ✅ **Success Checklist**

### Today:
- [ ] Test the status script: `.\status-dev-rds.ps1`
- [ ] Stop RDS tonight: `.\stop-dev-rds.ps1`
- [ ] Set calendar reminder for tomorrow morning

### Tomorrow:
- [ ] Start RDS in morning: `.\start-dev-rds.ps1`
- [ ] Send IAM request to admin

### This Week:
- [ ] Stop RDS every night (Mon-Fri)
- [ ] Track your savings
- [ ] Follow up on IAM permission request

### After IAM Approval:
- [ ] Deploy automated scheduler (5 minutes)
- [ ] Stop using manual scripts (automated!)
- [ ] Enjoy $165/month automatic savings

---

## 🎯 **Pro Tips**

### Set Calendar Reminders:
- **6:00 PM Mon-Fri:** "Stop dev RDS cluster" 
- **8:00 AM Mon-Fri:** "Start dev RDS cluster"

### Track Your Savings:
Create a simple log:
```
Week 1: Stopped 5 nights = ~$40 saved
Week 2: Stopped 5 nights = ~$40 saved
Week 3: Stopped 5 nights = ~$40 saved
Week 4: Stopped 5 nights = ~$40 saved
Monthly total: ~$165 saved! 🎉
```

### Weekend Savings Bonus:
If you don't work weekends, leave RDS stopped:
- **Friday 6 PM:** Stop RDS
- **Monday 8 AM:** Start RDS
- **Extra savings:** ~$15/weekend!

---

## ❓ **Troubleshooting**

### Script says "Cluster is already stopped"
✅ **Perfect!** Nothing to do. You're already saving money!

### Script says "Cluster is stopping/starting"
⏳ **Wait 2-5 minutes** and run the status script again.

### Script shows an error
1. Check AWS CLI is installed: `aws --version`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Verify RDS permissions in your IAM user policy

### Need to work after hours?
Just run `.\start-dev-rds.ps1` anytime you need access!
Cluster will be ready in 2-5 minutes.

---

## 🎉 **You Did It!**

**Immediate impact:**
- ✅ Phase 1 saving $60/month (LIVE)
- ✅ Scripts ready to save $165/month (TODAY)
- ✅ IAM request ready (AUTOMATION)
- ✅ Total potential: $225/month = $2,700/year

**That's amazing!** You've set up infrastructure that will save thousands of dollars per year. 🚀

---

## 📞 **Need Help?**

Check the documentation files or review the detailed guides:
- Script issues → `scripts/rds-manual-control/README.md`
- IAM questions → `IAM_PERMISSION_REQUEST.md`
- Deployment questions → `PHASE_2_DEPLOYMENT_GUIDE.md`

---

**Start saving money tonight!** 💰

Run: `.\stop-dev-rds.ps1`


