'use client';

import { useState } from 'react';

export function BlogNewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing! You\'ll receive our latest stories and insights.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="my-16 p-10 bg-base-100 border-t border-b border-amber-200/50">
      <div className="text-center max-w-md mx-auto">
        <div className="w-12 h-12 border border-amber-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h3 className="text-2xl font-serif font-light text-amber-950 mb-4">
          Stay Informed
        </h3>
        <p className="text-amber-700 mb-8 leading-relaxed font-light text-base">
          Get the latest caregiving insights, stories, and resources delivered to your inbox.
        </p>

        {status === 'success' ? (
          <div className="text-green-700 bg-green-50 p-4 rounded-lg border border-green-200">
            <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={status === 'loading'}
                className="flex-1 px-4 py-3 rounded-lg border border-amber-300 focus:border-amber-700 focus:ring-1 focus:ring-amber-700 outline-none transition-colors bg-white text-amber-900 placeholder-amber-500 font-light"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-3 bg-amber-950 text-white text-sm tracking-widest hover:bg-amber-900 transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Subscribing...
                  </div>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            
            {status === 'error' && (
              <p className="text-red-600 text-sm">{message}</p>
            )}
            
            <p className="text-xs text-amber-600 font-light">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}