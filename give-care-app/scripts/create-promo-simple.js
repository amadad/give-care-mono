import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);

const codes = [
  { code: 'SNAP', coupon: 'h2RJm11w' },
  { code: 'MEDICAID', coupon: '8BPnoFZJ' },
  { code: 'VETERAN', coupon: 'vuxLdjCS' },
  { code: 'STUDENT', coupon: 'YQddQd0S' },
  { code: 'CAREGIVER50', coupon: 'U1vi08rY' },
];

for (const { code, coupon } of codes) {
  try {
    const pc = await stripe.promotionCodes.create({ code, coupon });
    console.log(`✓ ${code}`);
  } catch (e) {
    console.log(`✗ ${code}: ${e.message}`);
  }
}
