#!/bin/bash

# 🔒 Digital Persona Platform - Security Monitoring Script
# Monitors urllib3 and torch vulnerabilities requiring attention

set -e

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Digital Persona Platform - Security Monitor${NC}"
echo -e "${BLUE}=================================================${NC}"
echo "Scan Date: $(date)"
echo ""

# Check if pip-audit is installed
if ! command -v pip-audit &> /dev/null; then
    echo -e "${YELLOW}⚠️  WARNING: pip-audit not found. Installing...${NC}"
    pip install pip-audit
fi

# Create logs directory if it doesn't exist
mkdir -p logs/security

# Generate scan filename with timestamp
SCAN_FILE="logs/security/security_scan_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${BLUE}🔍 Running vulnerability scan...${NC}"

# Run pip-audit and capture output
if pip-audit -r requirements.txt --desc > "$SCAN_FILE" 2>&1; then
    echo -e "${GREEN}✅ No critical vulnerabilities found!${NC}"
    echo "Scan results saved to: $SCAN_FILE"
else
    echo -e "${YELLOW}⚠️  Vulnerabilities detected - analyzing...${NC}"
    echo "Full scan results saved to: $SCAN_FILE"
    echo ""
    
    # Check for urllib3 vulnerabilities
    if grep -q "urllib3" "$SCAN_FILE"; then
        echo -e "${YELLOW}🚨 urllib3 VULNERABILITY DETECTED:${NC}"
        grep -A 5 -B 1 "urllib3" "$SCAN_FILE" || true
        echo ""
        echo -e "${YELLOW}📋 ACTION REQUIRED:${NC}"
        echo "   1. Review boto3/botocore compatibility for urllib3 upgrade"
        echo "   2. Test urllib3 >= 2.5.0 in development environment"
        echo "   3. Monitor https://github.com/urllib3/urllib3 for updates"
        echo ""
    fi
    
    # Check for torch vulnerabilities
    if grep -q "torch" "$SCAN_FILE"; then
        echo -e "${YELLOW}🚨 PyTorch VULNERABILITY DETECTED:${NC}"
        grep -A 5 -B 1 "torch" "$SCAN_FILE" || true
        echo ""
        echo -e "${YELLOW}📋 ACTION REQUIRED:${NC}"
        echo "   1. Verify if vulnerability affects your use case"
        echo "   2. Monitor https://github.com/pytorch/pytorch for security updates"
        echo "   3. Consider if upgrade is needed based on risk assessment"
        echo ""
    fi
fi

echo -e "${BLUE}📊 Current Package Versions:${NC}"
echo "urllib3: $(pip show urllib3 2>/dev/null | grep Version | cut -d' ' -f2 || echo 'Not installed')"
echo "boto3: $(pip show boto3 2>/dev/null | grep Version | cut -d' ' -f2 || echo 'Not installed')"
echo "torch: $(pip show torch 2>/dev/null | grep Version | cut -d' ' -f2 || echo 'Not installed')"
echo ""

echo -e "${BLUE}🔗 Security Resources:${NC}"
echo "📖 Security Monitoring Plan: SECURITY_MONITORING.md"
echo "🔍 GitHub Security Advisories:"
echo "   - urllib3: https://github.com/urllib3/urllib3/security/advisories"
echo "   - PyTorch: https://github.com/pytorch/pytorch/security/advisories"
echo "   - boto3: https://github.com/boto/boto3/security/advisories"
echo ""

echo -e "${BLUE}⏰ Next Steps:${NC}"
echo "1. Review scan results in: $SCAN_FILE"
echo "2. Check SECURITY_MONITORING.md for detailed action items"
echo "3. Schedule next scan for: $(date -d '+1 week' '+%Y-%m-%d')"
echo ""

# Check if any critical vulnerabilities need immediate attention
if grep -q "CRITICAL" "$SCAN_FILE" 2>/dev/null; then
    echo -e "${RED}🚨 CRITICAL VULNERABILITIES FOUND!${NC}"
    echo -e "${RED}⚠️  IMMEDIATE ACTION REQUIRED - Review scan results immediately${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Security monitoring scan complete${NC}"
echo "For detailed vulnerability analysis, see: $SCAN_FILE" 