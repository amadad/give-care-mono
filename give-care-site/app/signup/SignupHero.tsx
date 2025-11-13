'use client';

import { Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SignupFormConvex } from "@/app/components/sections/SignupFormConvex"

export default function SignupHero() {
  const shouldReduceMotion = useReducedMotion();

  const fadeInVariants = {
    initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0 },
    animate: { opacity: 1 },
  };

  return (
    <section className="pt-4 sm:pt-6 md:pt-12 pb-4 md:pb-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <motion.div
          initial={fadeInVariants.initial}
          animate={fadeInVariants.animate}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          className="text-center mb-6 md:mb-10"
        >
          <h1 className="heading-hero mb-3 md:mb-4">
            Get the support you deserve
          </h1>
          <p className="text-base sm:text-lg md:text-xl font-serif font-light text-amber-700 leading-relaxed max-w-2xl mx-auto">
            Text-based support starts immediately. Cancel anytime.
          </p>
        </motion.div>

        <motion.div
          initial={fadeInVariants.initial}
          animate={fadeInVariants.animate}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
        >
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <SignupFormConvex />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}
