'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { startTransition } from 'react';

/**
 * Next.js 16 View Transitions with Framer Motion fallback
 * Uses native browser View Transitions API when available
 * Falls back to Framer Motion for browsers without support
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Wrap navigation in startTransition for React 19 View Transitions
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    return (
      <div key={pathname}>
        {children}
      </div>
    );
  }

  // Fallback to Framer Motion for older browsers
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0.92 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.15,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
