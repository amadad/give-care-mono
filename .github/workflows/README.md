# GitHub Actions CI/CD

## E2E Tests Workflow

The `e2e-tests.yml` workflow runs the full end-to-end test suite on every push to main/dev and on pull requests.

### Required Secrets

The workflow uses a **4-stage pipeline** to ensure code quality:

1. **Unit Tests** (in-memory, fast)
2. **Deploy to Test** (preview environment)
3. **Integration Tests** (real deployment)
4. **Deploy to Prod** (only on main branch)

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Required (3 secrets)
- `CONVEX_DEPLOY_KEY` - Convex deploy key for CI/CD
- `OPENAI_API_KEY` - For OpenAI agent tests
- `GOOGLE_GENERATIVE_AI_API_KEY` - For Gemini agent tests

#### Optional (for SMS tests)
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

---

### How to Get CONVEX_DEPLOY_KEY

```bash
cd give-care-app

# Generate deploy key for CI/CD
npx convex deploy-key create ci-cd

# Copy the output (starts with "prod:...")
# Add to GitHub Secrets as CONVEX_DEPLOY_KEY
```

**Important:** This key allows deploying to your Convex project. Keep it secret!

### How the Pipeline Works

#### On Pull Requests (dev → main)
```
1. Run unit tests (in-memory, ~1 min)
2. Deploy to test environment (preview deployment)
3. Run integration tests (real deployment, ~2 min)
4. ✅ If all pass → PR can be merged
```

#### On Push to Main
```
1. Run unit tests
2. Deploy to test environment
3. Run integration tests
4. ✅ Deploy to production (automatic)
```

#### On Push to Dev
```
1. Run unit tests
2. Deploy to test environment
3. Run integration tests
4. ❌ Skip production deploy (stays in test)
```

---

### What Gets Tested

**Unit Tests (Stage 1):**
- Business logic (in-memory)
- Fast feedback (~1 min)
- No deployment needed

**Integration Tests (Stage 3):**
- Real Convex deployment
- End-to-end workflows
- API integrations (~2 min)

---

### Safety Features

- ✅ Tests run BEFORE deploying to prod
- ✅ Preview deployments isolated (no interference with dev/prod)
- ✅ Production deploys only on main branch
- ✅ All tests must pass before deploy
- ✅ Test failures block deployment

### Manual Trigger

You can manually trigger the workflow from the Actions tab using the "Run workflow" button.

### Test Results

- Test results are uploaded as artifacts (retained for 30 days)
- PR comments show pass/fail summary
- Full logs available in Actions tab
