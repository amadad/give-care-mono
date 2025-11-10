# Testing Google Maps Grounding

## Quick Test Methods

### 1. Direct Action Test (Fastest)

Test the `searchResources` action directly via Convex CLI:

```bash
cd give-care-app

# Test with a zip code
npx convex run resources:searchResources '{
  "query": "respite care facilities",
  "category": "respite",
  "zip": "90210"
}'

# Test with metadata (simulating user profile)
npx convex run resources:searchResources '{
  "query": "support groups for caregivers",
  "category": "support",
  "metadata": {
    "profile": {
      "zipCode": "10001"
    }
  }
}'
```

**Expected Response:**
```json
{
  "resources": "1. [Real Place Name] — [Real Address] ([Hours], rating [X.X])\n2. ...",
  "sources": [
    {
      "name": "Real Place Name",
      "address": "Real Address",
      "hours": "Mon-Fri 9am-5pm",
      "rating": 4.5,
      "phone": "+1-555-...",
      "category": "caregiving",
      "placeId": "ChIJ...",
      "uri": "https://maps.google.com/..."
    }
  ],
  "widgetToken": "...",
  "cached": false,
  "expiresAt": 1234567890
}
```

**What to Look For:**
- ✅ **Real place names** (not "respite Care Collective")
- ✅ **Real addresses** (not "90212 Oak Street")
- ✅ **Real ratings** (4.0-5.0 range, not always 4.6-4.8)
- ✅ **`placeId`** and **`uri`** fields present
- ✅ **`widgetToken`** present (if Maps Grounding worked)

**If you see stub data:**
- Check Convex logs for errors
- Verify `GEMINI_API_KEY` is set in Convex dashboard
- Check if Maps Grounding API returned errors

---

### 2. Via SMS (Real User Flow)

Send an SMS to your Twilio number:

```
Find respite care near me
```

**Prerequisites:**
1. User must have zip code in profile
2. Or include zip in message: "Find respite care in 90210"

**Check Response:**
- Should return real Google Maps results
- Addresses should be actual locations
- Ratings should vary (not all 4.6-4.8)

---

### 3. Via Convex Dashboard

1. Go to **Convex Dashboard** → **Functions**
2. Find `resources:searchResources`
3. Click **Run** button
4. Enter test data:
   ```json
   {
     "query": "adult day care centers",
     "category": "daycare",
     "zip": "90210"
   }
   ```
5. Click **Run** and check response

---

## Checking Logs

### View Convex Logs

1. **Convex Dashboard** → **Logs**
2. Filter by function: `resources:searchResources` or `maps:searchWithMapsGrounding`
3. Look for:
   - `[maps-grounding]` log messages
   - `AI SDK approach failed, using REST API fallback` (if fallback triggered)
   - `Gemini API error:` (if API failed)

### Expected Log Messages

**Success (AI SDK):**
```
[maps-grounding] Using AI SDK approach
```

**Fallback (REST API):**
```
[maps-grounding] AI SDK approach failed, using REST API fallback: [error]
```

**Error:**
```
[maps-grounding] Error: Gemini API error: 400 [error details]
```

---

## Verification Checklist

### ✅ Real Maps Data Indicators

- [ ] Place names are real business names (not generic "Care Collective")
- [ ] Addresses are real street addresses (not "90212 Oak Street")
- [ ] Ratings vary (4.0-5.0, not all 4.6-4.8)
- [ ] Phone numbers are real (not all "(555) 123-0000")
- [ ] `placeId` field is present (starts with "ChIJ...")
- [ ] `uri` field is present (Google Maps URL)
- [ ] `widgetToken` is present (if Maps Grounding worked)

### ❌ Stub Data Indicators

- [ ] Place names like "respite Care Collective", "respite Support Hub"
- [ ] Addresses like "90212 Oak Street", "90245 Maple Ave"
- [ ] All ratings are 4.6, 4.7, or 4.8
- [ ] All phone numbers are "(555) XXX-XXXX"
- [ ] No `placeId` or `uri` fields
- [ ] `source: 'stubbed'` in results

---

## Testing Different Scenarios

### Test 1: Valid Zip Code
```bash
npx convex run resources:searchResources '{
  "query": "respite care",
  "zip": "90210"
}'
```
**Expected:** Real Maps results

### Test 2: Missing Zip Code
```bash
npx convex run resources:searchResources '{
  "query": "respite care"
}'
```
**Expected:** Error response asking for zip code

### Test 3: Invalid Category
```bash
npx convex run resources:searchResources '{
  "query": "something random",
  "category": "unknown_category",
  "zip": "90210"
}'
```
**Expected:** Falls back to inferred category, still returns results

### Test 4: Cached Results
```bash
# Run twice with same category + zip
npx convex run resources:searchResources '{
  "query": "respite care",
  "zip": "90210"
}'

# Run again immediately
npx convex run resources:searchResources '{
  "query": "respite care",
  "zip": "90210"
}'
```
**Expected:** Second call returns `"cached": true` with same results

---

## Debugging Failed Tests

### Issue: Still Getting Stub Data

**Check:**
1. Convex logs for errors
2. `GEMINI_API_KEY` environment variable is set
3. API key has Maps Grounding permissions
4. Network connectivity (Convex → Google API)

**Fix:**
- Verify API key in Convex Dashboard → Settings → Environment Variables
- Check API key permissions in Google Cloud Console
- Review error logs for specific API errors

### Issue: "No grounding metadata" Error

**Meaning:** AI SDK approach didn't return Maps Grounding data

**Check:**
- Logs will show: `AI SDK approach failed, using REST API fallback`
- This is expected if AI SDK doesn't support Maps Grounding yet
- Fallback to REST API should still work

### Issue: API Rate Limits

**Symptoms:**
- `429 Too Many Requests` errors
- Empty results after many requests

**Fix:**
- Maps Grounding has rate limits (500 requests/day free tier)
- Wait or upgrade API quota
- Check usage in Google Cloud Console

---

## Performance Testing

### Measure Latency

```bash
time npx convex run resources:searchResources '{
  "query": "respite care",
  "zip": "90210"
}'
```

**Expected:**
- First call: 2-5 seconds (Maps Grounding API call)
- Cached call: <500ms (database lookup)

---

## Integration Test (Full Flow)

Test via the agent tool:

```bash
# This simulates what happens when user asks agent
npx convex run agents/main:runMainAgent '{
  "input": {
    "channel": "sms",
    "text": "Find respite care near 90210",
    "userId": "test-user-123"
  },
  "context": {
    "userId": "test-user-123",
    "locale": "en-US",
    "consent": {
      "emergency": true,
      "marketing": false
    },
    "metadata": {
      "profile": {
        "zipCode": "90210"
      }
    }
  }
}'
```

**Expected:** Agent uses `searchResources` tool and returns real Maps results in response.

---

## Environment Variables

Ensure these are set in Convex Dashboard:

- `GOOGLE_GENERATIVE_AI_API_KEY` - Required for Maps Grounding (AI SDK expects this name)
- `GEMINI_API_KEY` - Also supported for backward compatibility
- `TWILIO_ACCOUNT_SID` - For SMS testing (optional)
- `TWILIO_AUTH_TOKEN` - For SMS testing (optional)

---

## Next Steps

Once Maps Grounding is working:

1. ✅ Monitor API costs (Maps Grounding: $25/1K requests)
2. ✅ Check cache hit rates (should improve over time)
3. ✅ Verify widget tokens work in admin dashboard (if implementing UI)
4. ✅ Consider upgrading zip→lat/lng to Google Geocoding API for accuracy

