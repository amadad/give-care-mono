"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "give-care-app/convex/_generated/api";

export default function NewsletterSubscribeForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const subscribe = useAction(api.functions.newsletter.subscribe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    setStatus('loading');
    setMessage('');
    try {
      const result = await subscribe({ email });
      setStatus('success');
      setMessage(result.message || 'Thank you for subscribing!');
      form.reset();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
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