// Create promotion codes for existing coupons
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY, {
  apiVersion: '2025-09-30.clover',
});

const codesToCreate = [
  { code: 'SNAP', couponId: 'h2RJm11w' },
  { code: 'MEDICAID', couponId: '8BPnoFZJ' },
  { code: 'VETERAN', couponId: 'vuxLdjCS' },
  { code: 'STUDENT', couponId: 'YQddQd0S' },
  { code: 'CAREGIVER50', couponId: 'U1vi08rY' },
  { code: 'FRIEND50', couponId: '2ODjFMTz' },
  { code: 'CAREGIVER25', couponId: 'B3h659kW' },
  { code: 'LAUNCH2025', couponId: 'O7x47yIn' },
  { code: 'WELCOME50', couponId: 'u8NNTxHe' },
  { code: 'ANNUAL20', couponId: 'S8vmovFV' },
  { code: 'PARTNER-STORK', couponId: 'zuRTG1Y9' },
  { code: 'PARTNER-401C', couponId: 'pdu3yiPI' },
  { code: 'BSFC20', couponId: 'TRZM47tU' },
];

async function main() {
  console.log('Creating promotion codes for coupons...\n');

  for (const { code, couponId } of codesToCreate) {
    try {
      const promoCode = await stripe.promotionCodes.create({
        code,
        coupon: couponId,
        active: true,
      });

      console.log(`✓ Created: ${code} (${promoCode.id})`);
    } catch (error) {
      if (error.code === 'resource_already_exists') {
        console.log(`→ Already exists: ${code}`);
      } else {
        console.error(`✗ Failed: ${code} - ${error.message}`);
      }
    }
  }

  console.log('\n Done!');
}

main().catch(console.error);
