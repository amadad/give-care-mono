# Standard Operating Procedures (SOP)

**Purpose**: Quick reference for common operational tasks and troubleshooting.

---

## Development Workflow

### Starting Work
```bash
# 1. Generate Convex types (REQUIRED FIRST)
npx convex dev

# 2. Verify types exist
ls convex/_generated/  # Should show server.d.ts, api.d.ts

# 3. Start coding
npm run format  # Before commits
npm test        # Before push
```

### Making Changes
1. Edit code in `src/` or `convex/`
2. Convex dev server auto-reloads
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Format: `npm run format`
5. Commit with clear message

### Adding New Files
- **Agent tool?** → `src/tools.ts` + update `ARCHITECTURE.md`
- **Database table?** → `convex/schema.ts` (run `npx convex dev` after)
- **Convex function?** → `convex/functions/*.ts`
- **Documentation?** → See `CLAUDE.md` rules (don't create new docs without reason)

---

## Troubleshooting

### TypeScript Errors: "Cannot find module '_generated/server'"

**Cause**: Convex types not generated.

**Fix**:
```bash
npx convex dev
ls convex/_generated/  # Verify files exist
```

**Prevention**: Always run `npx convex dev` after:
- Fresh clone
- Editing `convex/schema.ts`
- Switching branches

---

### Convex Write Conflicts

**Symptom**: Function shows "Retried due to write conflicts" in Convex Dashboard → Insights

**Root Cause**: Missing cascade deletion (deleting parent before children)

**Fix**:
1. **Check schema** - Find tables with foreign key references
   ```bash
   grep "v.id(" convex/schema.ts
   ```

2. **Delete children first, then parent**:
   ```typescript
   // ❌ BAD: Delete parent first
   await ctx.db.delete(userId);  // Will fail if children exist

   // ✅ GOOD: Delete children first
   const conversations = await ctx.db
     .query('conversations')
     .withIndex('by_user', (q) => q.eq('userId', userId))
     .collect();
   for (const conv of conversations) {
     await ctx.db.delete(conv._id);
   }
   await ctx.db.delete(userId);  // Now safe
   ```

3. **Add error handling**:
   ```typescript
   for (const user of users) {
     try {
       // Delete related records...
       await ctx.db.delete(user._id);
     } catch (error) {
       console.error(`Failed to delete user ${user.phoneNumber}:`, error);
       // Continue with other users
     }
   }
   ```

**Cascade Order Example** (users table):
```
1. conversations (userId reference)
2. knowledgeUsage (userId reference)
3. assessmentResponses (sessionId reference)
4. assessmentSessions (userId reference)
5. wellnessScores (userId reference)
6. users (parent record)
```

**Prevention**:
- Always delete child records before parent
- Use indexed queries (`.withIndex()`) for fast lookups
- Test with single-record deletions first
- Add try-catch per record

**Reference**: [archive/CLEANUP_FIX.md](archive/CLEANUP_FIX.md)

---

### Agent Not Responding

**Symptom**: SMS sent but no response from agent

**Debug Steps**:
1. **Check Convex logs**:
   - Go to Convex Dashboard → Functions → `twilio.ts`
   - Look for errors in `onIncomingMessage`

2. **Check Twilio logs**:
   - Go to Twilio Console → Monitor → Logs
   - Verify webhook received and responded

3. **Check OpenAI API**:
   - Verify `OPENAI_API_KEY` in env vars
   - Check OpenAI Usage dashboard for errors

4. **Common issues**:
   - Missing env vars (check `.env`)
   - Invalid phone number format (must be E.164: +1XXXXXXXXXX)
   - Rate limit exceeded (check Convex logs)

---

### Deployment Issues

**Symptom**: `npx convex deploy --prod` fails

**Common Causes**:
1. **Missing env vars**:
   ```bash
   # Check .env has all required vars
   grep "OPENAI_API_KEY\|TWILIO" .env
   ```

2. **Schema changes not applied**:
   ```bash
   # Regenerate types first
   npx convex dev
   # Then deploy
   npx convex deploy --prod
   ```

3. **TypeScript errors**:
   ```bash
   # Check for errors
   npx tsc --noEmit
   # Fix errors, then deploy
   ```

**After Deployment**:
1. Update Twilio webhook URL:
   - URL: `https://YOUR_SITE.convex.site/twilio/sms`
   - Method: POST

2. Verify health:
   ```bash
   curl https://YOUR_SITE.convex.site/health
   ```

---

## Cloudflare Pages Deployment

### Admin Dashboard Build Process

**Environment Setup** (Cloudflare Pages):
- **Root Directory**: `admin-frontend`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Environment Variable**: `VITE_CONVEX_URL=https://agreeable-lion-831.convex.cloud`

**Build Flow**:
1. Cloudflare runs `npm run build`
2. Prebuild script (`node scripts/setup-convex.js`) creates `.env.local`:
   - Extracts deployment name from `VITE_CONVEX_URL`
   - Creates `CONVEX_DEPLOYMENT=prod:agreeable-lion-831`
   - Writes both to `.env.local` for runtime
3. TypeScript compilation uses committed types from `convex/_generated/`
4. Vite builds production bundle
5. App connects to Convex at runtime using `VITE_CONVEX_URL`

**Important Notes**:
- ✅ Convex types are committed to Git (`admin-frontend/convex/_generated/`)
- ✅ No Convex authentication needed in CI/CD
- ✅ Real-time connection works via `VITE_CONVEX_URL` at runtime
- ✅ Only one environment variable required in Cloudflare Pages

**Updating Convex Types**:
```bash
# 1. Make schema changes in convex/schema.ts
npx convex dev  # Regenerates types locally

# 2. Commit updated types
git add admin-frontend/convex/_generated/
git commit -m "Update Convex types after schema change"
git push

# 3. Cloudflare auto-deploys with new types
```

**Troubleshooting**:

**Build fails with "Cannot find module 'convex/_generated/api'"**:
- Check that types are committed: `git ls-files admin-frontend/convex/_generated/`
- If missing, run `npx convex dev` locally and commit

**Build fails with "VITE_CONVEX_URL is not set"**:
- Verify environment variable in Cloudflare Pages → Settings → Environment Variables
- Should be: `VITE_CONVEX_URL=https://agreeable-lion-831.convex.cloud`

**App deployed but no real-time updates**:
- Check browser console for Convex connection errors
- Verify `VITE_CONVEX_URL` is accessible at runtime
- Check Convex deployment is running: `npx convex dashboard`

**Reference Files**:
- Build script: `admin-frontend/scripts/setup-convex.js`
- Config: `admin-frontend/vite.config.ts`, `admin-frontend/convex.json`

---

## Database Operations

### Check User Data
```bash
# Open Convex dashboard
npx convex dashboard

# Go to Data → users table
# Search by phoneNumber: +15551234567
```

### Delete Test User
```bash
# Single user (safe)
npx convex run functions/cleanup:deleteUserByPhone '{"phoneNumber": "+15551234567"}'

# All users (DANGEROUS - use only in dev)
npx convex run functions/cleanup:deleteAllUsers
```

### View Conversation History
```bash
# Open Convex dashboard
npx convex dashboard

# Go to Data → conversations table
# Filter by userId
```

---

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test src/tools.test.ts

# Watch mode
npm test -- --watch
```

### Manual Testing (Local)
```bash
# 1. Start Convex dev server
npx convex dev

# 2. Expose webhook (optional, for Twilio integration)
ngrok http 8080

# 3. Update Twilio webhook to ngrok URL
# https://YOUR_NGROK_URL.ngrok.io/twilio/sms
```

### Testing in Production
**DO NOT test in production without approval!**

If approved:
1. Use test phone number (not real user)
2. Document test plan
3. Monitor Convex logs during test
4. Clean up test data after

---

## Code Review Checklist

Before submitting PR:

- [ ] `npx convex dev` runs without errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run format` applied
- [ ] `npm test` passes
- [ ] Updated relevant docs (ARCHITECTURE.md, CHANGELOG.md, etc.)
- [ ] No console.log statements left in code
- [ ] No hardcoded secrets (use env vars)
- [ ] Added comments for complex logic
- [ ] Tested locally

---

## Documentation Maintenance

### When to Update Docs

| Change | Update Doc |
|--------|-----------|
| New agent tool | `src/tools.ts` + `ARCHITECTURE.md` |
| Database schema change | `convex/schema.ts` (run `npx convex dev`) |
| New assessment | `ASSESSMENTS.md` |
| Deployment process change | `DEPLOYMENT.md` |
| Dev workflow change | `DEVELOPMENT.md` |
| Bug fix | `CHANGELOG.md` (if notable) |
| Feature complete | Delete `TASKS.md`, update `CHANGELOG.md` |

### Archive Process

**When to archive**:
- One-time fixes (e.g., write conflict fix)
- Completed planning docs
- Outdated feature docs

**How**:
```bash
# Move to archive with date prefix
mv docs/FIX_NAME.md docs/archive/2025-10-10_FIX_NAME.md

# Update docs/CLAUDE.md to remove reference
```

**When to delete from archive**:
- After 6 months if no references

---

## Emergency Procedures

### Production Down

1. **Check Convex status**: https://status.convex.dev
2. **Check OpenAI status**: https://status.openai.com
3. **Check Twilio status**: https://status.twilio.com
4. **View Convex logs**: Dashboard → Functions → Recent executions
5. **Rollback if needed**: `npx convex rollback`

### Database Corruption

**DO NOT manually edit database in production!**

If corruption suspected:
1. Document issue with screenshots
2. Export affected data: Convex Dashboard → Data → Export
3. Contact team lead
4. Fix in staging first
5. Apply fix to production with approval

### Security Incident

**Leaked API Key**:
1. **Immediately revoke** key in provider dashboard (OpenAI/Twilio/Convex)
2. Generate new key
3. Update env vars in deployment
4. Redeploy: `npx convex deploy --prod`
5. Document incident

**Unauthorized Access**:
1. Review Convex logs for suspicious activity
2. Check IP addresses in Twilio logs
3. Enable rate limiting (see `TASKS.md` for implementation)
4. Report to team lead

---

## Contacts

| Issue | Contact |
|-------|---------|
| Convex support | https://convex.dev/community |
| OpenAI API issues | https://help.openai.com |
| Twilio support | https://support.twilio.com |
| Code questions | Open GitHub issue |

---

**Last Updated**: 2025-10-10
**Version**: 0.3.0
