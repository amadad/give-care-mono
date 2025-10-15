import React from "react";

export default function Slide7() {
  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-[#FFE8D6] p-8">
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <h1 className="font-heading text-4xl font-bold">
          Work
        </h1>
        
        {/* Top Circle with Text */}
        <div className="relative flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* Left Arrow */}
            <div className="absolute -left-24 w-20 h-1 bg-gray-400"></div>
            <svg className="absolute -left-24 w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            
            {/* Circle */}
            <div className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center">
              <span className="text-2xl">$</span>
            </div>
            
            {/* Right Arrow */}
            <div className="absolute -right-24 w-20 h-1 bg-gray-400"></div>
            <svg className="absolute -right-24 w-6 h-6 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          
          {/* Text Below Circle */}
          <div className="mt-4 text-center">
            <p className="font-heading text-lg">Paid</p>
            <p className="font-body text-sm text-amber-700">(compensated)</p>
          </div>
        </div>

        {/* Divider with "or" */}
        <div className="relative w-1/2 border-t-2 border-gray-400">
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFE8D6] px-4 font-heading text-lg text-amber-700">
            or
          </span>
        </div>

        <h1 className="font-heading text-4xl font-bold">
          Care
        </h1>
        
        {/* Bottom Circle with Text */}
        <div className="relative flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            {/* Left Arrow */}
            <div className="absolute -left-24 w-20 h-1 bg-gray-400"></div>
            <svg className="absolute -left-24 w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            
            {/* Circle */}
            <div className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center">
              <span className="text-2xl">❤️</span>
            </div>
            
            {/* Right Arrow */}
            <div className="absolute -right-24 w-20 h-1 bg-gray-400"></div>
            <svg className="absolute -right-24 w-6 h-6 text-gray-400 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </div>
          
          {/* Text Below Circle */}
          <div className="mt-4 text-center">
            <p className="font-heading text-lg">Unpaid</p>
            <p className="font-body text-sm text-amber-700">(caregiving)</p>
          </div>
        </div>
      </div>
      
      {/* Source */}
      <div className="mt-8 text-center">
        <p className="font-body text-sm text-amber-700">Source: HBR (April 2025)</p>
      </div>
    </div>
  );
}
