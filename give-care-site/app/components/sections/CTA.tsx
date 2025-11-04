'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAction } from 'convex/react';
import { api } from 'give-care-app/convex/_generated/api';

export default function CTA() {
  const shouldReduceMotion = useReducedMotion();
  const newsletterSignup = useAction(api.functions.newsletterActions.newsletterSignup);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    setStatus('loading');
    setMessage('');
    try {
      await newsletterSignup({ email });
      setStatus('success');
      setMessage('Thank you for subscribing!');
      form.reset();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  return (
    <section className="section-tight bg-base-100">
      <div className="container-editorial">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="heading-section mb-4">Ready for Support That Actually Helps?</h2>
          <p className="body-standard mb-8 max-w-2xl mx-auto">
            Weekly support and resources for families navigating care.
          </p>
        
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="join w-full">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="input input-bordered join-item w-full input-primary"
                required
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                className="btn join-item bg-amber-950 hover:bg-amber-900 text-white border-amber-950 hover:border-amber-900"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            {message && (
              <p className={`text-sm mt-3 ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
