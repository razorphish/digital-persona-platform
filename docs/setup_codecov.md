# Codecov Setup Guide

## Current Issue

The CI workflow is hitting Codecov rate limits because it's using the public upload token instead of a repository-specific token.

## Solutions

### Option 1: Disable Codecov (Recommended for now)

The workflow has been updated to:

- Only upload to Codecov on pushes (not pull requests)
- Upload coverage reports as GitHub artifacts instead
- Continue working even if Codecov fails

### Option 2: Set up Codecov properly

1. **Go to Codecov**: https://codecov.io
2. **Sign in with GitHub** and add your repository
3. **Get your repository token** from the Codecov dashboard
4. **Add the token to GitHub Secrets**:
   ```bash
   # Go to your repository settings
   # Settings > Secrets and variables > Actions
   # Add new repository secret:
   # Name: CODECOV_TOKEN
   # Value: [your codecov repository token]
   ```

### Option 3: Use GitHub's built-in coverage

The workflow now uploads coverage reports as artifacts, which you can view directly in GitHub Actions.

## Current Configuration

The workflow now:

- ✅ Runs coverage reports locally
- ✅ Uploads coverage as GitHub artifacts (30-day retention)
- ✅ Attempts Codecov upload only on pushes (not PRs)
- ✅ Continues even if Codecov fails
- ✅ Provides verbose logging for debugging

## View Coverage Reports

1. Go to your GitHub Actions run
2. Click on "Artifacts"
3. Download `backend-coverage-reports` or `frontend-coverage-reports`
4. Open the coverage files in your browser or IDE

## Benefits of This Approach

- ✅ No rate limit issues
- ✅ Coverage data is preserved
- ✅ Works without external dependencies
- ✅ Can still use Codecov if properly configured
- ✅ Coverage reports are easily accessible
