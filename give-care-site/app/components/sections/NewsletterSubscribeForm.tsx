"use client";

import { useState } from "react";

export default function NewsletterSubscribeForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Thank you for subscribing!');
        form.reset();
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.error || 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="join w-full">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="input input-bordered join-item w-full"
          required
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          className="btn btn-primary join-item"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
      {message && (
        <p className={`text-sm mt-2 ${status === 'success' ? 'text-green-200' : 'text-red-200'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 