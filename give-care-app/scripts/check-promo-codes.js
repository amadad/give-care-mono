// Check active promotion codes
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function main() {
  // Get all active promotion codes
  const promoCodes = await stripe.promotionCodes.list({
    active: true,
    limit: 100,
    expand: ['data.coupon'],
  });

  console.log(`\nFound ${promoCodes.data.length} active promotion codes:\n`);

  for (const promo of promoCodes.data) {
    const coupon = typeof promo.coupon === 'string' ? await stripe.coupons.retrieve(promo.coupon) : promo.coupon;

    console.log(`Code: ${promo.code}`);
    console.log(`  Coupon: ${coupon.name || coupon.id} (${coupon.id})`);
    console.log(`  Active: ${promo.active}`);
    console.log(`  Discount: $${coupon.amount_off ? (coupon.amount_off / 100).toFixed(2) : coupon.percent_off + '%'}`);
    console.log(`  Times Redeemed: ${promo.times_redeemed}`);
    console.log(`  Max Redemptions: ${promo.max_redemptions || 'Unlimited'}`);
    console.log('');
  }

  // Check specific coupon IDs to see if they have promo codes
  const checkCoupons = ['h2RJm11w', '8BPnoFZJ', 'vuxLdjCS', 'YQddQd0S', 'U1vi08rY'];
  console.log('\n=== Checking specific coupons for promotion codes ===\n');

  for (const couponId of checkCoupons) {
    const coupon = await stripe.coupons.retrieve(couponId);
    const promoCodesForCoupon = promoCodes.data.filter(p => p.coupon.id === couponId);

    console.log(`${coupon.name} (${couponId}):`);
    if (promoCodesForCoupon.length > 0) {
      console.log(`  ✓ Has ${promoCodesForCoupon.length} promotion code(s):`);
      promoCodesForCoupon.forEach(p => console.log(`    - ${p.code}`));
    } else {
      console.log(`  ✗ NO PROMOTION CODES (customers cannot enter this at checkout)`);
    }
    console.log('');
  }
}

main().catch(console.error);
