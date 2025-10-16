'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function NewHero() {
  return (
    <section className="pt-6 sm:pt-8 md:pt-12 pb-0 bg-base-100">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl pb-0">
          {/* Minimal Headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-4 md:mb-6 px-4"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif font-light tracking-tight text-amber-950 leading-[1.2] mb-4 sm:mb-6">
              You're carrying more than anyone sees—we remember all of it
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

            <p className="text-base sm:text-lg md:text-xl font-serif font-light text-amber-700 leading-relaxed max-w-2xl mx-auto px-4">
              Track your capacity. Get help matched to YOUR needs.
              We check in before things get hard. Works on any phone—no app required.
            </p>
          </motion.div>

          {/* Dual CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-0 px-4 w-full sm:w-auto"
          >
            <Link
              href="/assessment"
              className="w-full sm:w-auto inline-block px-8 sm:px-10 py-3 sm:py-4 bg-amber-950 text-white text-sm tracking-widest hover:bg-amber-900 transition-colors duration-200 rounded-lg text-center"
            >
              Start Free Assessment
            </Link>
            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-block px-8 sm:px-10 py-3 sm:py-4 bg-white text-amber-950 text-sm tracking-widest hover:bg-amber-50 transition-colors duration-200 rounded-lg border border-amber-200 text-center"
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
                alt="Parent using GiveCare to check in on their wellbeing"
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
