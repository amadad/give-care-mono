'use client';

import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { SignupFormConvex } from "@/app/components/sections/SignupFormConvex"
import { motion } from 'framer-motion';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-base-100 to-amber-50/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-serif text-amber-950 mb-6">
                Get started:<br />Simple SMS support
              </h1>
              <p className="text-xl text-amber-800">
                Straightforward caregiving guidance over text. Cancel anytime.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-6xl mx-auto"
            >
              <SignupFormConvex />
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

