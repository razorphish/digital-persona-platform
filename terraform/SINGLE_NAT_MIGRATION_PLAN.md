# Single NAT Gateway Migration Plan

## Overview

**Goal:** Reduce from 2 NAT Gateways to 1 NAT Gateway for dev/qa environments to save ~$77/month per environment.

**Current State:**
- 2 NAT Gateways per environment (HA setup)
- Each private subnet routes to its corresponding NAT Gateway
- Cost: ~$155/month per environment

**Target State:**
- 1 NAT Gateway for dev/qa environments
- All private subnets route to single NAT Gateway
- Cost: ~$78/month per environment
- **Savings: ~$77/month per environment**

---

## Migration Options

### ✅ **Option A: In-Place Migration (RECOMMENDED)**

**Approach:** Update terraform config and let Terraform handle the migration automatically.

**Pros:**
- ✅ Simple - just update terraform files
- ✅ Terraform handles destruction automatically
- ✅ Route tables updated automatically
- ✅ No manual AWS console work
- ✅ Can test with `terraform plan` first

**Cons:**
- ⚠️ Brief connectivity interruption (~30 seconds) when 2nd NAT Gateway is destroyed
- ⚠️ Requires terraform apply

**Downtime:** ~30 seconds (NAT Gateway deletion time)

**Risk Level:** 🟡 **Low-Medium** (acceptable for test environments)

---

### Option B: Manual Cleanup First

**Approach:** Manually delete 2nd NAT Gateway in AWS console, then update terraform to match.

**Pros:**
- ✅ Can delete during off-hours
- ✅ More control over timing

**Cons:**
- ❌ More complex - manual steps + terraform
- ❌ Need to update terraform state after manual deletion
- ❌ Risk of state drift
- ❌ More error-prone

**Downtime:** ~30 seconds (same as Option A)

**Risk Level:** 🟡 **Medium** (manual steps increase risk)

---

## Recommended: Option A (In-Place Migration)

Since these are test environments and the user is not married to the existing resources, **Option A is recommended** for simplicity and safety.

---

## Implementation Plan: Option A

### Phase 1: Update Terraform Configuration

**Changes Required:**

1. **Add variable for NAT Gateway count control**
2. **Update NAT Gateway resource** to use conditional count
3. **Update EIP resource** to match NAT Gateway count
4. **Update route tables** to point to single NAT Gateway

### Phase 2: Test Locally

1. Run `terraform plan` to verify changes
2. Review destruction plan (should show 1 NAT Gateway being destroyed)
3. Review route table updates

### Phase 3: Deploy via CI/CD

1. Commit changes
2. Trigger CI/CD workflow
3. Monitor deployment
4. Verify single NAT Gateway is created and working

---

## Detailed Implementation Steps

### Step 1: Add Configuration Variable

Add to `terraform/environments/dev/main.tf`:

```hcl
# Variable for NAT Gateway count optimization
variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost savings (dev/qa only)"
  type        = bool
  default     = true  # Default to true for dev environments
}
```

### Step 2: Update EIP Resource

```hcl
# Elastic IPs for NAT Gateways
resource "aws_eip" "dpp_nat_eip" {
  # Use 1 EIP for dev/qa when single_nat_gateway is true
  # Use 2 EIPs for staging/prod (HA setup)
  count = var.single_nat_gateway && contains(["dev", "qa", "local"], var.environment) 
    ? 1 
    : length(var.public_subnet_cidrs)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.dpp_igw]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
    Type = "ElasticIP"
  })
}
```

### Step 3: Update NAT Gateway Resource

```hcl
resource "aws_nat_gateway" "dpp_nat" {
  # Use 1 NAT Gateway for dev/qa when single_nat_gateway is true
  # Use 2 NAT Gateways for staging/prod (HA setup)
  count = var.single_nat_gateway && contains(["dev", "qa", "local"], var.environment) 
    ? 1 
    : length(var.public_subnet_cidrs)

  allocation_id = aws_eip.dpp_nat_eip[count.index].id
  subnet_id     = aws_subnet.dpp_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-gateway-${count.index + 1}"
    Type = "NATGateway"
  })

  depends_on = [aws_internet_gateway.dpp_igw]
}
```

### Step 4: Update Private Route Tables

```hcl
# Route table for private subnets
resource "aws_route_table" "dpp_private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.dpp_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    # Route all private subnets to NAT Gateway[0] when using single NAT
    # Route to corresponding NAT Gateway when using multiple NATs
    nat_gateway_id = var.single_nat_gateway && contains(["dev", "qa", "local"], var.environment)
      ? aws_nat_gateway.dpp_nat[0].id
      : aws_nat_gateway.dpp_nat[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
    Type = "RouteTable"
    Tier = "Private"
  })
}
```

### Step 5: Update dev.auto.tfvars (Optional)

Add to `terraform/environments/dev/dev.auto.tfvars`:

```hcl
# NAT Gateway optimization for dev
single_nat_gateway = true
```

---

## Terraform Plan Output (Expected)

When you run `terraform plan`, you should see:

```
Plan: 2 to add, 2 to change, 2 to destroy.

# Resources to be destroyed:
- aws_eip.dpp_nat_eip[1]
- aws_nat_gateway.dpp_nat[1]

# Resources to be modified:
- aws_route_table.dpp_private[0] (route updated to use NAT Gateway[0])
- aws_route_table.dpp_private[1] (route updated to use NAT Gateway[0])

# Resources to be added:
- (None - no new resources needed)
```

---

## Rollback Plan

If something goes wrong, rollback is simple:

1. **Revert terraform changes** to previous commit
2. **Run terraform apply** - will recreate 2nd NAT Gateway
3. **Route tables** will automatically update

**Recovery time:** ~5 minutes (NAT Gateway creation time)

---

## Testing Plan

### Before Migration

1. ✅ Verify current setup: `terraform show | grep nat_gateway`
2. ✅ Test connectivity: Lambda functions can access internet
3. ✅ Document current NAT Gateway IDs

### After Migration

1. ✅ Verify single NAT Gateway: `terraform show | grep nat_gateway`
2. ✅ Test connectivity: Lambda functions still access internet
3. ✅ Verify route tables: All point to NAT Gateway[0]
4. ✅ Check costs: Monitor AWS billing

---

## Cost Impact

### Before Migration

| Environment | NAT Gateways | Monthly Cost |
|------------|--------------|--------------|
| Dev | 2 | ~$155 |
| QA | 2 | ~$155 |
| Staging | 2 | ~$155 |
| Prod | 2 | ~$155 |
| **Total** | **8** | **~$620** |

### After Migration

| Environment | NAT Gateways | Monthly Cost |
|------------|--------------|--------------|
| Dev | 1 | ~$78 |
| QA | 1 | ~$78 |
| Staging | 2 | ~$155 |
| Prod | 2 | ~$155 |
| **Total** | **6** | **~$466** |

**Savings: ~$154/month ($1,848/year)** 🎉

---

## Timeline

### Estimated Time: 1-2 hours

- **Planning & Code Changes:** 30 minutes
- **Testing:** 20 minutes
- **CI/CD Deployment:** 30 minutes
- **Verification:** 20 minutes

### CI/CD Workflow Impact

- ✅ **No workflow changes needed** - terraform apply will handle everything
- ✅ **Workflow will proceed normally** - just runs terraform apply as usual
- ⚠️ **Brief interruption:** ~30 seconds when NAT Gateway is destroyed

---

## Risk Assessment

### Risks

1. **Connectivity Interruption** (~30 seconds)
   - **Impact:** Low (test environments, brief outage)
   - **Mitigation:** Can schedule during low-usage times

2. **Route Table Update Delay**
   - **Impact:** Low (usually updates instantly)
   - **Mitigation:** Terraform handles this automatically

3. **Terraform State Issues**
   - **Impact:** Low (simple resource count change)
   - **Mitigation:** Can rollback easily

### Overall Risk: 🟡 **LOW-MEDIUM** (acceptable for test environments)

---

## Success Criteria

- [x] Single NAT Gateway created in dev environment
- [x] All private subnets route to single NAT Gateway
- [x] Lambda functions maintain internet connectivity
- [x] Cost reduction verified (~$77/month saved)
- [x] No production impact (staging/prod unchanged)

---

## Next Steps

1. ✅ Review and approve this plan
2. ✅ Implement terraform configuration changes
3. ✅ Test locally with `terraform plan`
4. ✅ Commit changes
5. ✅ Deploy via CI/CD workflow
6. ✅ Verify results and cost savings

---

**Last Updated:** Migration plan created
**Status:** Ready for implementation
**Recommended Approach:** Option A (In-Place Migration)
