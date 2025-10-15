'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function NewHero() {
  return (
    <section className="pt-8 pb-0 md:pt-12 md:pb-0 bg-base-100">
        <div className="container-editorial">
          {/* Minimal Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4 md:mb-6"
          >
            <h1 className="heading-hero mb-6">
              Caregiving is hard.<br />You deserve support that actually helps.
            </h1>

            {/* Forbes Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <span className="text-xs uppercase tracking-widest text-amber-700 font-light">As Featured In</span>
              <a
                href="https://www.forbes.com/sites/christinecarter/2025/08/12/12-startups-proving-motherhood-over-40-is-a-market-advantage/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block hover:opacity-70 transition-opacity"
              >
                <Image
                  src="/Forbes_logo.svg"
                  alt="Forbes"
                  width={80}
                  height={22}
                  className="h-5 w-auto"
                />
              </a>
            </motion.div>

            <p className="body-large max-w-2xl mx-auto">
              Track your burden over time. Get evidence-based support matched to your needs.
            </p>
          </motion.div>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <a
              href="/assessment"
              className="btn-editorial-primary"
            >
              Start Free Assessment
            </a>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-2xl md:max-w-3xl">
              <Image
                src="/w.webp"
                alt="Caregiver using GiveCare"
                width={1200}
                height={1200}
                className="w-full h-auto"
                priority
              />
            </div>
          </motion.div>
        </div>
    </section>
  );
}
