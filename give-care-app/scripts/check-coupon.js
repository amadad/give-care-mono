// Check if coupons have product restrictions
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function checkCoupon(couponId) {
  const coupon = await stripe.coupons.retrieve(couponId, {
    expand: ['applies_to'],
  });

  console.log(`\n${coupon.name} (${couponId}):`);
  console.log(`  Valid: ${coupon.valid}`);
  console.log(`  Amount Off: $${coupon.amount_off ? (coupon.amount_off / 100).toFixed(2) : 'N/A'}`);
  console.log(`  Percent Off: ${coupon.percent_off || 'N/A'}%`);
  console.log(`  Duration: ${coupon.duration}`);
  console.log(`  Duration in Months: ${coupon.duration_in_months || 'N/A'}`);
  console.log(`  Applies To Products: ${coupon.applies_to?.products?.length ? coupon.applies_to.products.join(', ') : 'All products'}`);
  console.log(`  Max Redemptions: ${coupon.max_redemptions || 'Unlimited'}`);
  console.log(`  Times Redeemed: ${coupon.times_redeemed}`);
  console.log(`  Redeem By: ${coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : 'No expiration'}`);
}

async function main() {
  const coupons = [
    'h2RJm11w', // SNAP
    '8BPnoFZJ', // MEDICAID
    'vuxLdjCS', // VETERAN
    'YQddQd0S', // STUDENT
    'U1vi08rY', // CAREGIVER50
  ];

  for (const couponId of coupons) {
    await checkCoupon(couponId);
  }
}

main().catch(console.error);
