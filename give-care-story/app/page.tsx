"use client";

import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-tan">
      <div className="relative h-64 w-64">
        <Image
          src="/gc-s.svg"
          alt="Give Care Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
