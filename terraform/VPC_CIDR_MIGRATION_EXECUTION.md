# VPC CIDR Migration Execution Guide

## ✅ Changes Applied

### Updated Variables in `terraform/environments/dev/main.tf`

**Before:**
- VPC CIDR: `10.0.0.0/16` (conflicts with VWR)
- Private Subnets: `10.0.1.0/24`, `10.0.2.0/24` (conflicts with VWR)
- Public Subnets: `10.0.10.0/24`, `10.0.11.0/24` (conflicts with VWR)

**After:**
- VPC CIDR: `10.1.0.0/16` ✅ (exclusive to DPP)
- Private Subnets: `10.1.1.0/24`, `10.1.2.0/24` ✅ (exclusive to DPP)
- Public Subnets: `10.1.10.0/24`, `10.1.11.0/24` ✅ (exclusive to DPP)

---

## 🚀 Migration Execution

### Step 1: Verify Current State

**Current DPP VPC in AWS:**
```
VPC: vpc-0965ea6a86e0e9c01
CIDR: 10.0.0.0/16  ❌ (conflicts with VWR)
```

**VWR VPC (keep unchanged):**
```
VPC: vpc-09f5a12851992c922
CIDR: 10.0.0.0/16  ✅ (will remain)
```

---

### Step 2: Pre-Migration Checklist

Before running terraform apply:

- [x] ✅ Variables updated to `10.1.0.0/16`
- [ ] Review terraform plan to see what will be destroyed/recreated
- [ ] Handle orphaned DB subnet group (separate issue from previous analysis)
- [ ] Verify no critical workloads (dev environment)
- [ ] Backup terraform state (if needed)

---

### Step 3: Migration Options

#### Option A: Destroy & Recreate (Recommended for Dev)

Since this is a dev environment and the VPC needs to be recreated with new CIDRs:

```bash
cd terraform/environments/dev

# 1. Review what will change
terraform plan

# 2. Destroy old VPC (will cascade to subnets, NAT gateways, etc.)
terraform destroy -target=aws_vpc.dpp_vpc

# 3. Apply with new CIDRs
terraform apply
```

**What Happens:**
- ✅ Old VPC (`vpc-0965ea6a86e0e9c01`) destroyed
- ✅ Old subnets destroyed
- ✅ Old NAT gateways destroyed
- ✅ New VPC created with `10.1.0.0/16`
- ✅ New subnets created with `10.1.1.0/24`, `10.1.2.0/24`, `10.1.10.0/24`, `10.1.11.0/24`
- ✅ All resources recreated in new VPC

**Timeline:** ~15-20 minutes for VPC recreation

#### Option B: Let Terraform Handle It (Automatic)

Terraform will detect the CIDR change and destroy/recreate:

```bash
cd terraform/environments/dev
terraform apply
```

**Note:** Terraform will show that VPC needs to be replaced (destroyed and recreated) because CIDR cannot be changed in-place.

---

### Step 4: Handle DB Subnet Group Issue

**CRITICAL:** The orphaned DB subnet group issue must be resolved first or during migration:

**Option 1: Delete before migration**
```bash
# Remove from state
terraform state rm aws_db_subnet_group.database

# Delete in AWS
aws rds delete-db-subnet-group \
  --db-subnet-group-name dev-dev01-dpp-db-subnet-group \
  --region us-west-1
```

**Option 2: Let migration handle it**
- When VPC is destroyed, the subnet group will become even more orphaned
- Delete it after VPC recreation
- Terraform will create new one with new VPC subnets

**Recommendation:** Delete it before/during VPC migration for cleaner process

---

### Step 5: Verification After Migration

**Verify New VPC:**
```bash
aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=dev-dev01-dpp-vpc" \
  --query "Vpcs[0].[VpcId,CidrBlock]" \
  --region us-west-1
```

**Expected Output:**
```
[
  "vpc-XXXXXXXXX",
  "10.1.0.0/16"  ✅
]
```

**Verify New Subnets:**
```bash
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<NEW_VPC_ID>" \
  --query "Subnets[].[SubnetId,CidrBlock,Tags[?Key=='Name'].Value|[0]]" \
  --region us-west-1
```

**Expected Output:**
```
Private Subnets:
  - subnet-XXXXXXXXX (10.1.1.0/24)  ✅
  - subnet-XXXXXXXXX (10.1.2.0/24)  ✅

Public Subnets:
  - subnet-XXXXXXXXX (10.1.10.0/24)  ✅
  - subnet-XXXXXXXXX (10.1.11.0/24)  ✅
```

**Verify VWR Unchanged:**
```bash
aws ec2 describe-vpcs \
  --vpc-ids vpc-09f5a12851992c922 \
  --query "Vpcs[0].CidrBlock" \
  --region us-west-1
```

**Expected Output:**
```
"10.0.0.0/16"  ✅ (unchanged)
```

---

## 📋 Migration Checklist

### Pre-Migration:
- [x] ✅ Update terraform variables (DONE)
- [ ] Review terraform plan
- [ ] Handle orphaned DB subnet group
- [ ] Verify no critical workloads

### During Migration:
- [ ] Run `terraform plan` to preview changes
- [ ] Destroy old VPC (or let terraform handle it)
- [ ] Apply new VPC with new CIDRs
- [ ] Monitor for errors

### Post-Migration:
- [ ] Verify new VPC CIDR is `10.1.0.0/16`
- [ ] Verify new subnets have correct CIDRs
- [ ] Verify all resources using new VPC
- [ ] Verify VWR VPC unchanged (`10.0.0.0/16`)
- [ ] Test connectivity (RDS, Lambda, etc.)
- [ ] Update documentation

---

## ⚠️ Important Notes

### What Will Be Recreated:

1. ✅ **VPC** - New CIDR block
2. ✅ **Subnets** - New CIDR blocks  
3. ✅ **Internet Gateway** - Recreated with VPC
4. ✅ **NAT Gateways** - Recreated in new subnets
5. ✅ **Elastic IPs** - Recreated for NAT gateways
6. ✅ **Route Tables** - Recreated for new subnets
7. ✅ **Security Groups** - Will reference new VPC
8. ✅ **RDS Subnet Group** - Needs to be recreated anyway (orphaned)

### Resources That May Need Attention:

1. ⚠️ **RDS Cluster** - If exists, will need new subnet group
2. ⚠️ **Lambda Functions** - Will reconnect to new VPC
3. ⚠️ **AWS Batch** - Will use new VPC configuration
4. ⚠️ **VPCEndpoints** - Will need to be recreated

### Resources Not Affected:

- ✅ **S3 Buckets** - Not VPC-specific
- ✅ **IAM Roles** - Not VPC-specific
- ✅ **ACM Certificates** - Not VPC-specific
- ✅ **Route53** - Not VPC-specific
- ✅ **CloudFront** - Not VPC-specific

---

## 🔄 Combined Migration Plan

Since we have TWO issues:
1. Orphaned DB subnet group (references deleted VPC)
2. CIDR conflict (same CIDRs as VWR)

**Recommended Combined Approach:**

1. **Delete orphaned DB subnet group** (not in use anyway)
2. **Update variables to `10.1.0.0/16`** (DONE ✅)
3. **Destroy old VPC** (with old CIDRs)
4. **Create new VPC** (with new CIDRs)
5. **Recreate all resources** (with new VPC)

This solves both issues in one migration!

---

## 📊 Expected Timeline

- **Variable Update:** ✅ DONE (instant)
- **Terraform Plan:** ~2-3 minutes
- **VPC Destruction:** ~5-10 minutes
- **VPC Recreation:** ~10-15 minutes
- **Resource Recreation:** ~10-15 minutes
- **Verification:** ~5 minutes

**Total:** ~30-45 minutes

---

**Status:** ✅ Variables updated, ready for migration  
**Next Step:** Review terraform plan, then execute migration  
**Risk:** Low (dev environment, no production data)
