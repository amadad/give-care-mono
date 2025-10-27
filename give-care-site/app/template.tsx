'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Minimal page transition - subtle crossfade only
 * Starts at 92% opacity to avoid visible "blink"
 * No vertical movement to reduce motion sickness
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
