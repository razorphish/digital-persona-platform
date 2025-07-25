#!/bin/bash

echo "Checking CI workflow status..."
gh run list --workflow="Continuous Integration (Optimized)" --limit 3 --json status,conclusion,createdAt,headBranch,url 