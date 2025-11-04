'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Next.js 16 View Transitions with Framer Motion fallback
 * Uses native browser View Transitions API when available
 * Falls back to Framer Motion for browsers without support
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always use Framer Motion for consistent hydration
  // Check for View Transitions support happens client-side only
  const hasViewTransitions = mounted && typeof document !== 'undefined' && 'startViewTransition' in document;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: hasViewTransitions ? 1 : 0.92 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: hasViewTransitions ? 0 : 0.15,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
