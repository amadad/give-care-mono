import React from "react";

export default function Slide10() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-2xl">
          <h1 className="font-heading text-4xl leading-tight text-amber-900">
            Who Cares for the Caregiver?
          </h1>
        </div>
        
        {/* Three Circles with Arrows */}
        <div className="flex items-center justify-center gap-16">
          {/* First Circle - Care Recipient */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-amber-800 bg-white flex items-center justify-center mb-lg">
              <span className="text-xl">🏥</span>
            </div>
            <div className="text-center">
              <h3 className="font-heading text-xl text-amber-900 mb-md">Care Recipient</h3>
              <p className="font-body text-md text-amber-800">Person needing support</p>
            </div>
          </div>
          
          {/* Arrow 1 - pointing left */}
          <div className="flex items-center">
            <svg className="w-12 h-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </div>
          
          {/* Second Circle - Caregiver */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-amber-800 bg-white flex items-center justify-center mb-lg">
              <span className="text-xl">👥</span>
            </div>
            <div className="text-center">
              <h3 className="font-heading text-xl text-amber-900 mb-md">Caregiver</h3>
              <p className="font-body text-md text-amber-800">Family member or friend</p>
            </div>
          </div>
          
          {/* Arrow 2 - pointing left */}
          <div className="flex items-center">
            <svg className="w-12 h-12 text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          </div>
          
          {/* Third Circle - Question Mark */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-amber-800 bg-white flex items-center justify-center mb-lg">
              <span className="text-xl">❓</span>
            </div>
            <div className="text-center">
              <h3 className="font-heading text-xl text-amber-900 mb-md">Who Supports</h3>
              <p className="font-body text-md text-amber-800">the Caregiver?</p>
            </div>
          </div>
        </div>
        
        {/* Quote at bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 max-w-4xl">
          <div className="text-center">
            <blockquote className="font-body text-lg text-amber-800 mb-2 italic">
              "Caregivers are Nagelians. Using whatever observations they can, they figure out what it's like to be the patient."
            </blockquote>
            <p className="font-body text-sm text-amber-700">
              Dr. Jason Karlawish, co-director of the Penn Memory Center
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
