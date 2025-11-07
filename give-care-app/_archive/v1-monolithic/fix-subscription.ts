/**
 * Quick script to fix subscription for user in DEV
 * Run with: npx tsx fix-subscription.ts
 */

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://agreeable-lion-831.convex.cloud");

async function main() {
  console.log("Fixing subscription for js7f9srrjhhtp5qdcp3w6t9ecx7tt99n...");

  // Using the patchSubscriptionDebug mutation we created
  const result = await client.mutation(
    "subscriptions:patchSubscriptionDebug" as any,
    {
      phoneNumber: "+15162382932",
      subscriptionStatus: "active",
      stripeCustomerId: "cus_TMoGry3iWVMKYJ",
      stripeSubscriptionId: "sub_1SQ7gRAXk51qocidVdo2e4je",
    }
  );

  console.log("Success!", result);
}

main().catch(console.error);
