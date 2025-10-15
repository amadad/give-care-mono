# Stripe Checkout Pre-fill Configuration

**Updated:** 2025-10-11
**Status:** ✅ Configured

---

## 🎯 **WHAT GOT CONFIGURED**

Your Stripe checkout now **pre-fills** data from your `/signup` page:

### **Pre-filled Automatically:**
- ✅ **Email** - User sees their email, can't change it
- ✅ **Name** - Stored in Stripe Customer, shows in checkout
- ✅ **Phone** - Already collected, not asked again

### **User Enters at Checkout:**
- 🆕 **Billing Address** (if you enabled it on payment links)
- 🆕 **Payment Details** (card info)
- 🆕 **Promo Code** (optional)

---

## 🔧 **HOW IT WORKS**

### **Your Signup Flow:**

```
1. User fills /signup form:
   ├─ Name: "Jane Caregiver"
   ├─ Email: "jane@example.com"
   ├─ Phone: "+15551234567"
   └─ Plan: Monthly $9.99

2. createCheckoutSession (convex/stripe.ts):
   ├─ Creates Stripe Customer:
   │  ├─ email: "jane@example.com"
   │  ├─ name: "Jane Caregiver"
   │  └─ phone: "+15551234567"
   ├─ Creates checkout session:
   │  ├─ customer: customer.id ← Links to customer
   │  ├─ customer_email: customer.email ← Pre-fills email
   │  └─ phone_number_collection: disabled ← Don't ask again
   └─ Returns checkout URL

3. Stripe Checkout Page shows:
   ✅ Email: jane@example.com (pre-filled, locked)
   ✅ Name: Jane Caregiver (pre-filled from customer)
   🆕 Billing Address: [User enters if enabled]
   🆕 Card Details: [User enters]
   🆕 Promo Code: [Optional]
```

---

## 📝 **CODE CHANGES MADE**

### **convex/stripe.ts** (lines 82-116)

**Added:**
```typescript
customer_update: {
  // Allow updating customer info at checkout (address, etc.)
  address: 'auto',
},
// ...
customer_email: customer.email, // Pre-fill email (user can't change it)
phone_number_collection: {
  enabled: false, // Don't collect phone - we already have it
},
```

**What this does:**
- `customer: customer.id` - Links checkout to existing customer (name pre-fills automatically)
- `customer_email` - Shows email field as read-only
- `phone_number_collection: false` - Doesn't ask for phone again
- `customer_update.address: 'auto'` - Allows updating address if they enter it

---

## 🎨 **PAYMENT LINK SETTINGS**

### **Recommended Settings:**

Go to https://dashboard.stripe.com/payment-links and set:

**Customer Information Collection:**
- ✅ **Billing address:** Required (collect it here!)
- ❌ **Phone:** Don't collect (you already have it)
- ❌ **Email:** Optional or Required (will be pre-filled anyway)
- ❌ **Name:** Don't collect (pre-filled from customer)

**Other Settings:**
- ✅ **Allow promotion codes:** Enabled
- ✅ **Collect tax automatically:** Optional (enable if using Stripe Tax)

---

## 🧪 **TEST YOUR CHECKOUT**

### **Test Pre-fill:**

1. Go to your signup page
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Phone: +15551234567
3. Click submit → Redirected to Stripe checkout
4. **Verify you see:**
   - ✅ Email field shows "test@example.com" (locked)
   - ✅ Name might be pre-filled (depends on payment link settings)
   - 🆕 Billing address form (if enabled)
   - 🆕 Card details form (empty)
   - 🆕 Promo code field (optional)

---

## 🔄 **STORING ADDRESS FROM CHECKOUT**

When user completes payment, their billing address is stored in Stripe. You can retrieve it in your webhook:

### **Update Your Webhook Handler** (Optional)

Edit `convex/stripe.ts` around line 143:

```typescript
case "checkout.session.completed": {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  const phoneNumber = session.metadata?.phoneNumber;

  if (!userId || !phoneNumber) {
    console.error("Missing userId or phoneNumber in session metadata");
    return { success: false };
  }

  // Get customer details including address
  const customer = await stripe.customers.retrieve(
    session.customer as string
  ) as Stripe.Customer;

  // Store address if provided
  if (customer.address) {
    await ctx.runMutation(internal.subscriptions.updateUserAddress, {
      userId,
      address: {
        line1: customer.address.line1 || '',
        line2: customer.address.line2 || null,
        city: customer.address.city || '',
        state: customer.address.state || '',
        postalCode: customer.address.postal_code || '',
        country: customer.address.country || '',
      },
    });
  }

  // Activate subscription
  await ctx.runMutation(internal.subscriptions.activateSubscription, {
    userId,
    stripeSubscriptionId: session.subscription as string,
    subscriptionStatus: "active",
  });

  // Send welcome SMS
  await ctx.runAction(internal.stripe.sendWelcomeSMS, {
    phoneNumber,
    userId,
  });

  break;
}
```

---

## 📋 **BENEFITS OF PRE-FILLING**

### **Better User Experience:**
- ✅ Faster checkout (don't retype email/phone)
- ✅ Less friction = higher conversion
- ✅ Fewer typos (data already validated on signup)

### **Better Data Quality:**
- ✅ Consistent email across systems
- ✅ Phone number in E.164 format
- ✅ Address validated by Stripe

### **Fraud Prevention:**
- ✅ Customer record created before payment
- ✅ Billing address verification
- ✅ Audit trail (who signed up, when)

---

## ⚙️ **CONFIGURATION OPTIONS**

### **If You Want Name Editable at Checkout:**
Remove `name` pre-fill by NOT creating the customer beforehand (not recommended).

### **If You Want Email Editable:**
Remove `customer_email` parameter (not recommended - leads to mismatches).

### **If You Want to Collect Phone Again:**
Change `phone_number_collection.enabled` to `true` (not recommended - you already have it).

### **If You Don't Want Address:**
Disable "Collect billing address" on payment links.

---

## ✅ **CURRENT CONFIGURATION SUMMARY**

| Field | Source | Editable? | When Collected |
|-------|--------|-----------|----------------|
| **Name** | Signup form | No* | Before checkout |
| **Email** | Signup form | No | Before checkout |
| **Phone** | Signup form | No | Before checkout |
| **Address** | Checkout | Yes | During checkout |
| **Payment** | Checkout | Yes | During checkout |
| **Promo Code** | Checkout | Yes | During checkout |

*Name might be editable depending on payment link settings, but will default to customer name.

---

## 🚀 **YOU'RE ALL SET**

Your checkout now:
- ✅ Pre-fills email and name from signup
- ✅ Doesn't ask for phone again
- ✅ Collects billing address (if enabled)
- ✅ Accepts promo codes
- ✅ Links to existing customer record

**Deploy and test it!**

```bash
npx convex deploy --prod
```

Then test the full flow from `/signup` → Stripe checkout → `/welcome`.
