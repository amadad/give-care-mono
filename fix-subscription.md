# Fix Subscription Status in Production

## Steps to Fix Your Subscription

### 1. Go to Production Convex Dashboard

Open: https://dashboard.convex.dev/deployment/doting-tortoise-411

### 2. Click "Functions" tab → Click "Query" button

### 3. Find Your User

Paste this query and click "Run":

```typescript
// Replace with your actual phone number in E.164 format (+1...)
const phoneNumber = "+1...2932"; // Your phone number

const user = await ctx.db
  .query('users')
  .withIndex('by_phone', q => q.eq('phoneNumber', phoneNumber))
  .first();

if (!user) {
  return { error: "User not found with that phone number" };
}

// Get subscription
const subscription = await ctx.db
  .query('subscriptions')
  .withIndex('by_user', q => q.eq('userId', user._id))
  .first();

return {
  userId: user._id,
  email: user.email,
  name: user.name,
  currentSubscriptionStatus: subscription?.subscriptionStatus,
  stripeCustomerId: subscription?.stripeCustomerId,
  stripeSubscriptionId: subscription?.stripeSubscriptionId
};
```

### 4. Copy Your User ID

From the result above, copy the `userId` value (looks like: `js7db78hm4xh0xs9cg0rgyck8n7ttbfx`)

### 5. Update Subscription to Active

Click "Mutation" button and paste:

```typescript
// Replace USER_ID_HERE with the ID from step 4
const userId = "USER_ID_HERE" as any;

const subscription = await ctx.db
  .query('subscriptions')
  .withIndex('by_user', q => q.eq('userId', userId))
  .first();

if (!subscription) {
  // Create subscription if doesn't exist
  await ctx.db.insert('subscriptions', {
    userId,
    subscriptionStatus: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return { success: true, action: "created" };
} else {
  // Update existing subscription
  await ctx.db.patch(subscription._id, {
    subscriptionStatus: 'active',
    updatedAt: Date.now()
  });
  return { success: true, action: "updated", oldStatus: subscription.subscriptionStatus };
}
```

### 6. Verify It Worked

Go back to Query and run the query from Step 3 again. Should now show `subscriptionStatus: "active"`

### 7. Test SMS

Text your production number: **+1 (888) 966-8985**

Send: "Hi"

You should now get the agent response instead of the signup link!

---

## Why This Happened

- You completed Stripe checkout in production ✅
- But Stripe webhook might not have fired properly
- Or the webhook fired but subscription status wasn't updated
- This manually sets it to "active" so SMS will work

---

## Alternative: Check Stripe Dashboard

1. Go to https://dashboard.stripe.com/subscriptions
2. Search for your email
3. Check if subscription shows as "Active"
4. If it's there, the Convex webhook just missed it - manual update fixes this
5. If it's NOT there, you may need to redo checkout
