"use client";

import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-tan">
      <div className="text-center">
        <div className="relative h-48 w-48 mx-auto mb-8">
          <Image
            src="/gc-s.svg"
            alt="Give Care Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="font-heading text-4xl font-bold text-amber-900 mb-4">404</h1>
        <p className="font-body text-amber-800">Page not found</p>
      </div>
    </div>
  );
}
