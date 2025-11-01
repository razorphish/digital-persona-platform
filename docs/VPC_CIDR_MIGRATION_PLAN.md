# VPC CIDR Migration Plan - DPP Exclusivity

## 🔴 Problem Identified

### Current Conflict

Both **VWR** and **DPP** are using the **SAME CIDR blocks**, which creates confusion and potential conflicts:

| Platform | VPC CIDR | Private Subnets | Public Subnets | Status |
|----------|---------|----------------|----------------|--------|
| **VWR** | `10.0.0.0/16` | `10.0.1.0/24`, `10.0.2.0/24` | `10.0.10.0/24`, `10.0.11.0/24` | ✅ **Active (Keep)** |
| **DPP** | `10.0.0.0/16` | `10.0.1.0/24`, `10.0.2.0/24` | `10.0.10.0/24`, `10.0.11.0/24` | ⚠️ **Conflicts with VWR** |

**Impact:**
- ✅ Different VPCs (separate network isolation) - No actual network conflict
- ❌ **Same CIDR ranges** - Causes confusion, hard to distinguish in logs
- ❌ **Potential for mistakes** - Could accidentally reference wrong VPC
- ❌ **Not mutually exclusive** - Doesn't clearly separate platforms

---

## ✅ Solution: Change DPP to Different CIDR Blocks

### Proposed DPP CIDR Blocks

**Recommended:** Use `10.1.0.0/16` for DPP (different /16 block from VWR)

| Component | Current (DPP) | New (DPP) | VWR (Keep) |
|-----------|---------------|-----------|------------|
| **VPC CIDR** | `10.0.0.0/16` | `10.1.0.0/16` | `10.0.0.0/16` |
| **Private Subnet 1** | `10.0.1.0/24` | `10.1.1.0/24` | `10.0.1.0/24` |
| **Private Subnet 2** | `10.0.2.0/24` | `10.1.2.0/24` | `10.0.2.0/24` |
| **Public Subnet 1** | `10.0.10.0/24` | `10.1.10.0/24` | `10.0.10.0/24` |
| **Public Subnet 2** | `10.0.11.0/24` | `10.1.11.0/24` | `10.0.11.0/24` |

**Benefits:**
- ✅ Completely separate /16 network space
- ✅ Easy to identify in logs (10.1.x.x = DPP, 10.0.x.x = VWR)
- ✅ No conflicts or confusion
- ✅ Clear separation between platforms

---

## 📋 Migration Plan

### Phase 1: Update Terraform Variables

**File:** `terraform/environments/dev/main.tf` (lines 75-91)

**Current:**
```hcl
variable "vpc_cidr_block" {
  description = "VPC CIDR block for DPP platform"
  type        = string
  default     = "10.0.0.0/16"  # ❌ Same as VWR
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]  # ❌ Same as VWR
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]  # ❌ Same as VWR
}
```

**New:**
```hcl
variable "vpc_cidr_block" {
  description = "VPC CIDR block for DPP platform"
  type        = string
  default     = "10.1.0.0/16"  # ✅ Different from VWR
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24"]  # ✅ Different from VWR
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.1.10.0/24", "10.1.11.0/24"]  # ✅ Different from VWR
}
```

---

### Phase 2: Migration Strategy

#### Option A: In-Place Migration (Recommended for Dev)

Since this is a **dev environment** and resources can be recreated:

1. **Destroy existing VPC infrastructure**
   ```bash
   cd terraform/environments/dev
   terraform destroy -target=aws_vpc.dpp_vpc
   # This will cascade to subnets, NAT gateways, etc.
   ```

2. **Update variables** (Phase 1)

3. **Recreate with new CIDRs**
   ```bash
   terraform apply
   ```

**Pros:**
- ✅ Clean slate
- ✅ No orphaned resources
- ✅ Simplest approach

**Cons:**
- ⚠️ Brief downtime (for dev, acceptable)
- ⚠️ Resources recreated

#### Option B: Blue-Green Migration (Safer)

1. **Create new VPC with new CIDRs** (side-by-side)
2. **Migrate resources** one by one
3. **Delete old VPC**

**Pros:**
- ✅ Zero downtime
- ✅ Can test before switching

**Cons:**
- ⚠️ More complex
- ⚠️ Requires resource migration

**Recommendation:** **Option A** for dev environment (simpler, acceptable downtime)

---

### Phase 3: Verification

After migration, verify:

1. ✅ New VPC has correct CIDR: `10.1.0.0/16`
2. ✅ Subnets have correct CIDRs: `10.1.1.0/24`, `10.1.2.0/24`, `10.1.10.0/24`, `10.1.11.0/24`
3. ✅ All resources using new VPC
4. ✅ No references to old `10.0.x.x` CIDRs
5. ✅ VWR still using `10.0.x.x` (unchanged)

---

## 🚨 Important Considerations

### Resources That Need Migration:

1. ✅ **VPC** - New CIDR block
2. ✅ **Subnets** - New CIDR blocks
3. ✅ **Route Tables** - Auto-updated with new subnets
4. ✅ **Security Groups** - Will reference new VPC
5. ✅ **RDS Subnet Group** - Will use new subnets (already needs recreation)
6. ✅ **NAT Gateways** - Will use new public subnets
7. ✅ **Lambda Functions** - Will use new VPC configuration
8. ✅ **AWS Batch** - Will use new VPC configuration

**Note:** Most resources are VPC-specific, so they'll automatically use new VPC.

### What Stays the Same:

- ✅ **S3 Buckets** - Not VPC-specific
- ✅ **IAM Roles** - Not VPC-specific  
- ✅ **ACM Certificates** - Not VPC-specific
- ✅ **Route53 Records** - Not VPC-specific
- ✅ **CloudFront** - Not VPC-specific

---

## 📝 Implementation Checklist

### Pre-Migration:

- [ ] Backup current terraform state
- [ ] Document current VPC ID: `vpc-0965ea6a86e0e9c01`
- [ ] Verify no critical workloads running
- [ ] Notify team (if applicable)

### Migration:

- [ ] Update `terraform/environments/dev/main.tf` variables (lines 75-91)
- [ ] Update `terraform/shared-variables.tf` if variables defined there
- [ ] Run `terraform plan` to review changes
- [ ] Destroy old VPC infrastructure (or migrate)
- [ ] Apply new VPC with new CIDRs
- [ ] Verify new VPC created correctly

### Post-Migration:

- [ ] Verify all resources using new VPC
- [ ] Test connectivity
- [ ] Verify no references to old CIDRs
- [ ] Update documentation
- [ ] Clean up old VPC (if blue-green approach)

---

## 🔍 Alternative CIDR Options

If `10.1.0.0/16` conflicts with other infrastructure:

### Option 2: `10.2.0.0/16`
- Private: `10.2.1.0/24`, `10.2.2.0/24`
- Public: `10.2.10.0/24`, `10.2.11.0/24`

### Option 3: `172.16.0.0/16`
- Private: `172.16.1.0/24`, `172.16.2.0/24`
- Public: `172.16.10.0/24`, `172.16.11.0/24`

### Option 4: `192.168.0.0/16`
- Private: `192.168.1.0/24`, `192.168.2.0/24`
- Public: `192.168.10.0/24`, `192.168.11.0/24`

**Recommendation:** Stick with `10.1.0.0/16` (standard private IP range, easy to remember)

---

## 📊 Current AWS State

### VWR (Vital Woman Reset) - KEEP UNCHANGED

```
VPC: vpc-09f5a12851992c922
CIDR: 10.0.0.0/16
Private Subnets:
  - subnet-07b093a67093153ab (10.0.1.0/24)
  - subnet-00c518f74dfc93354 (10.0.2.0/24)
Public Subnets:
  - subnet-00cfc01c07bd5a171 (10.0.10.0/24)
  - subnet-0e64c9f28ad78dea6 (10.0.11.0/24)
```

### DPP (Digital Persona Platform) - NEEDS MIGRATION

```
VPC: vpc-0965ea6a86e0e9c01
CIDR: 10.0.0.0/16  ❌ Same as VWR
Private Subnets:
  - subnet-0de0d539c7f027c6e (10.0.1.0/24)  ❌ Same as VWR
  - subnet-0990f71fab22eb850 (10.0.2.0/24)  ❌ Same as VWR
Public Subnets:
  - subnet-0f496ac8d85f3bcc4 (10.0.10.0/24)  ❌ Same as VWR
  - subnet-05a28e30b8da16c72 (10.0.11.0/24)  ❌ Same as VWR
```

**After Migration:**
```
VPC: vpc-XXXXXXXXX (new)
CIDR: 10.1.0.0/16  ✅ Different from VWR
Private Subnets:
  - subnet-XXXXXXXXX (10.1.1.0/24)  ✅ Different from VWR
  - subnet-XXXXXXXXX (10.1.2.0/24)  ✅ Different from VWR
Public Subnets:
  - subnet-XXXXXXXXX (10.1.10.0/24)  ✅ Different from VWR
  - subnet-XXXXXXXXX (10.1.11.0/24)  ✅ Different from VWR
```

---

## ✅ Recommended Action Plan

1. **Immediate:** Update terraform variables to use `10.1.0.0/16`
2. **Before Apply:** Handle orphaned DB subnet group issue (from previous analysis)
3. **Migration:** Destroy and recreate VPC with new CIDRs (since it's dev)
4. **Verification:** Confirm new CIDRs are in place and VWR unchanged

**Timeline:** Can be done in single workflow run after variables are updated

---

**Status:** 🔴 **MIGRATION REQUIRED** - DPP using same CIDRs as VWR  
**Priority:** High - Should be done before next deployment  
**Risk:** Low for dev environment
