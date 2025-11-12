/**
 * Promo Code Seed Data
 * 
 * 15 promo codes for partners, press, and promotions.
 * Idempotent seeding - can be run multiple times safely.
 */

export interface PromoCodeSeed {
  code: string;
  discountType: 'percent' | 'amount';
  discountValue: number;
  maxUses?: number;
  expiresAt?: number;
  active: boolean;
}

export const PROMO_CODE_SEEDS: PromoCodeSeed[] = [
  {
    code: 'PARTNER2025',
    discountType: 'percent',
    discountValue: 20,
    active: true,
  },
  {
    code: 'PRESS50',
    discountType: 'amount',
    discountValue: 5000, // $50 in cents
    maxUses: 100,
    active: true,
  },
  {
    code: 'EARLYBIRD',
    discountType: 'percent',
    discountValue: 30,
    expiresAt: new Date('2025-12-31').getTime(),
    active: true,
  },
  {
    code: 'CAREGIVER25',
    discountType: 'percent',
    discountValue: 25,
    active: true,
  },
  {
    code: 'FAMILY100',
    discountType: 'amount',
    discountValue: 10000, // $100 in cents
    maxUses: 50,
    active: true,
  },
  {
    code: 'WELCOME10',
    discountType: 'percent',
    discountValue: 10,
    active: true,
  },
  {
    code: 'COMMUNITY15',
    discountType: 'percent',
    discountValue: 15,
    active: true,
  },
  {
    code: 'SUPPORT20',
    discountType: 'percent',
    discountValue: 20,
    active: true,
  },
  {
    code: 'LAUNCH30',
    discountType: 'percent',
    discountValue: 30,
    maxUses: 200,
    expiresAt: new Date('2025-12-31').getTime(),
    active: true,
  },
  {
    code: 'FOUNDER50',
    discountType: 'percent',
    discountValue: 50,
    maxUses: 10,
    active: true,
  },
  {
    code: 'BETA20',
    discountType: 'percent',
    discountValue: 20,
    active: true,
  },
  {
    code: 'REFERRAL15',
    discountType: 'percent',
    discountValue: 15,
    active: true,
  },
  {
    code: 'ANNUAL20',
    discountType: 'percent',
    discountValue: 20,
    active: true,
  },
  {
    code: 'NONPROFIT40',
    discountType: 'percent',
    discountValue: 40,
    maxUses: 25,
    active: true,
  },
  {
    code: 'MEDIA100',
    discountType: 'amount',
    discountValue: 10000, // $100 in cents
    maxUses: 20,
    active: true,
  },
];

