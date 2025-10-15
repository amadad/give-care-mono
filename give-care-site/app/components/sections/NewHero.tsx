'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function NewHero() {
  return (
    <section className="pt-8 md:pt-12 pb-0 bg-base-100">
        <div className="container-editorial pb-0">
          {/* Minimal Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4 md:mb-6"
          >
            <h1 className="heading-hero mb-6">
              AI caregiving support that remembers everything—<br />no app required
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
              Track your burnout score. Get help matched to YOUR struggles.
              We remember everything and check in before crisis hits. Works on any phone—no app required.
            </p>
          </motion.div>

          {/* Dual CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-0"
          >
            <Link
              href="/assessment"
              className="btn-editorial-primary"
            >
              Start Free Assessment
            </Link>
            <Link
              href="/how-it-works"
              className="btn-editorial-secondary"
            >
              See How It Works →
            </Link>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center"
          >
            <div className="relative w-full max-w-3xl md:max-w-4xl">
              <Image
                src="/w.webp"
                alt="Caregiver using GiveCare"
                width={1200}
                height={1200}
                className="w-full h-auto block"
                priority
              />
            </div>
          </motion.div>
        </div>
    </section>
  );
}
