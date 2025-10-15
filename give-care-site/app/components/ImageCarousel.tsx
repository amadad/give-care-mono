'use client';

import React from 'react';

const stats = [
  {
    value: '53M+',
    title: 'Americans provide unpaid care: The nation’s largest invisible workforce.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    value: '1 in 4',
    title: 'Caregivers sacrifice their own health. Care comes at a personal cost.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    )
  },
  {
    value: '$600B',
    title: 'In unpaid labor each year. Caregivers subsidize the system—with their time and effort.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export default function ImageCarousel() {
  return (
    <div className="w-full py-16 bg-gradient-to-b from-amber-50/30 to-transparent">
      <div className="container mx-auto px-4">
        {/* Header section with decorative elements */}
        <div className="mb-12 relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-950 mb-3 font-serif">The Caregiving Crisis, by the Numbers</h2>
          <p className="text-base text-accessible-muted text-center max-w-3xl mx-auto font-light tracking-wide">
            Understanding the scale of the caregiving challenge in the United States today
          </p>
        </div>
        
        {/* Main statistics container with enhanced styling */}
        <div className="rounded-xl overflow-hidden border-2 border-orange-500 mb-10 shadow-lg shadow-amber-900/10 hover:shadow-amber-900/20 transition-shadow duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* First stat with enhanced typography and icon */}
            <div className="bg-base-100 p-8 pb-20 hover:bg-amber-50 transition-colors duration-300 relative min-h-[280px]">
              <div className="mb-1">
                <span className="text-amber-700">{stats[0].icon}</span>
              </div>
              <div className="text-5xl font-bold text-orange-500 font-serif tracking-tight">{stats[0].value}</div>
              <div className="text-amber-800 mt-2 font-light">{stats[0].title}</div>
              <div className="absolute bottom-6 right-6">
                <div className="bg-amber-950 text-white text-xs px-5 py-2.5 rounded-full uppercase tracking-widest font-medium shadow-sm flex items-center justify-center space-x-1.5 min-w-[130px]">
                  <span className="w-1.5 h-1.5 bg-orange-300 rounded-full inline-block"></span>
                  <span>Scale of Care</span>
                </div>
              </div>
            </div>

            {/* Second stat */}
            <div className="bg-base-100 border-x-2 border-orange-100 p-8 pb-20 hover:bg-amber-50 transition-colors duration-300 relative min-h-[280px]">
              <div className="mb-1">
                <span className="text-amber-700">{stats[1].icon}</span>
              </div>
              <div className="text-5xl font-bold text-orange-500 font-serif tracking-tight">{stats[1].value}</div>
              <div className="text-amber-800 mt-2 font-light">{stats[1].title}</div>
              <div className="absolute bottom-6 right-6">
                <div className="bg-amber-950 text-white text-xs px-5 py-2.5 rounded-full uppercase tracking-widest font-medium shadow-sm flex items-center justify-center space-x-1.5 min-w-[130px]">
                  <span className="w-1.5 h-1.5 bg-orange-300 rounded-full inline-block"></span>
                  <span>Toll on Health</span>
                </div>
              </div>
            </div>

            {/* Third stat with enhanced visual elements */}
            <div className="bg-base-100 p-8 pb-20 relative hover:bg-amber-50 transition-colors duration-300 min-h-[280px]">
              <div className="mb-1">
                <span className="text-amber-700">{stats[2].icon}</span>
              </div>
              <div className="text-5xl font-bold text-orange-500 font-serif tracking-tight">{stats[2].value}</div>
              <div className="text-amber-800 mt-2 font-light">{stats[2].title}</div>
              <div className="absolute bottom-6 right-6">
                <div className="bg-amber-950 text-white text-xs px-5 py-2.5 rounded-full uppercase tracking-widest font-medium shadow-sm flex items-center justify-center space-x-1.5 min-w-[130px]">
                  <span className="w-1.5 h-1.5 bg-orange-300 rounded-full inline-block"></span>
                  <span>Economic Value</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Call to action with enhanced visual appeal */}
        <div className="bg-amber-900 text-white rounded-xl p-6 max-w-3xl mx-auto shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-700 rounded-full translate-y-1/2 -translate-x-1/2 opacity-40"></div>
          <div className="relative flex items-start gap-4">
            <div className="mt-1 bg-amber-800/50 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1 !text-white">Caregivers need support now more than ever</h3>
              <div className="text-sm opacity-90 font-light">GiveCare is changing how we approach family caregiving</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
