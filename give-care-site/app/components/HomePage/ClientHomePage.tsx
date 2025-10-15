'use client';

import AnimatedChat from "../AnimatedChat";
import LogoMarquee from "../LogoMarquee";
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

const chatScenarios = [
  {
    "label": "Burnout",
    "messages": [
      { "id": 1, "text": "I haven't left the house in 3 weeks. Missed my doctor appointment again. I just snapped at my kids for no reason.", "isUser": true },
      { "id": 2, "text": "When did you last have time away from caregiving? Even an hour counts.", "isUser": false },
      { "id": 3, "text": "I can't remember. There's no one to watch mom.", "isUser": true },
      { "id": 4, "text": "Found 3 respite services in your area. Two offer same-day bookings. Want me to text you the details?", "isUser": false },
      { "id": 5, "text": "But what if something happens while I'm gone?", "isUser": true },
      { "id": 6, "text": "All three are licensed for medical needs. Start with 2 hours. Here's what to expect and emergency procedures.", "isUser": false },
      { "id": 7, "text": "Maybe I could get my hair done? It's been so long.", "isUser": true },
    ]
  },
  {
    "label": "Guilt",
    "messages": [
      { "id": 1, "text": "I promised her I'd never put her in a home. But I'm breaking. I feel like such a failure.", "isUser": true },
      { "id": 2, "text": "Many caregivers face this decision. Want specific questions to help you think through the options?", "isUser": false },
      { "id": 3, "text": "I just feel so guilty even thinking about it.", "isUser": true },
      { "id": 4, "text": "Here's a decision framework used by other families. Also connecting you with a caregiver support group that meets Tuesdays.", "isUser": false },
      { "id": 5, "text": "Yes. I need to know I'm not a terrible person.", "isUser": true },
      { "id": 6, "text": "You're doing the hard work of making informed decisions. That's good caregiving. Here are 3 questions to start with.", "isUser": false },
      { "id": 7, "text": "How do I even start exploring options?", "isUser": true },
    ]
  },
  {
    "label": "Identity",
    "messages": [
      { "id": 1, "text": "I don't even know who I am anymore. 5 years of this. I used to have a career, friends, dreams.", "isUser": true },
      { "id": 2, "text": "What did you do before caregiving? Even small connections to that person can help.", "isUser": false },
      { "id": 3, "text": "I was a graphic designer. Loved hiking. Had a book club.", "isUser": true },
      { "id": 4, "text": "Try 15 minutes of sketching this week. Found online design communities and local hiking groups that meet weekends.", "isUser": false },
      { "id": 5, "text": "I wouldn't even know where to start.", "isUser": true },
      { "id": 6, "text": "Here's one specific goal: sketch for 15 minutes on Tuesday. Also texting you info on 2 caregiver support groups.", "isUser": false },
      { "id": 7, "text": "Yes. I miss having people who understand.", "isUser": true },
    ]
  },
  {
    "label": "Navigation",
    "messages": [
      { "id": 1, "text": "I can barely afford dad's medications. There has to be help out there but I don't know where to start.", "isUser": true },
      { "id": 2, "text": "Based on your dad's situation, checking 6 programs you might qualify for. This will take 2 minutes.", "isUser": false },
      { "id": 3, "text": "Really? I've tried looking online but it's overwhelming.", "isUser": true },
      { "id": 4, "text": "Found matches for 4 programs. Total savings: ~$2,000/month plus 30 hours respite care. Here are the applications.", "isUser": false },
      { "id": 5, "text": "That's life-changing. But won't the applications take forever?", "isUser": true },
      { "id": 6, "text": "Start with PACE program. Need Form CMS-10555. Texting you the direct link and phone number for help.", "isUser": false },
    ]
  }
];

export default function ClientHomePage() {
  const [selectedScenario, setSelectedScenario] = useState(0);

  return (
    <>
      {/* Hero Section with Phone */}
      <section className="py-16 bg-gradient-to-b from-base-100 to-amber-50/20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-serif text-amber-950 mb-6">
              Real help.<br />No AI personality.
            </h1>
            <p className="text-xl text-amber-800">
              Straightforward caregiving support over SMS. No apps, no fake empathy, just guidance when you need it.
            </p>
          </motion.div>

          {/* Scenario buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex gap-2 justify-center mb-4"
          >
            {chatScenarios.map((scenario, index) => (
              <button 
                key={index}
                className={`px-4 py-2 text-xs rounded-full transition-all ${
                  selectedScenario === index 
                    ? 'bg-amber-900 text-white' 
                    : 'bg-base-200 text-amber-800 hover:bg-base-300'
                }`}
                onClick={() => setSelectedScenario(index)}
              >
                {scenario.label}
              </button>
            ))}
          </motion.div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center px-4"
          >
            <div className="transform scale-75 sm:scale-90">
              <div className="mockup-phone border-primary shadow-2xl">
                <div className="mockup-phone-camera"></div>
                <div className="mockup-phone-display">
                  <div className="artboard artboard-demo phone-1 w-full h-full overflow-y-auto p-2 relative">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src="/phone.jpg" 
                        alt="Phone background" 
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Animated Chat Messages */}
                    <div className="absolute z-10 w-full px-6" style={{ top: '155px', bottom: '20px', left: '0', right: '0', overflowY: 'auto' }}>
                      <AnimatedChat 
                        key={selectedScenario} 
                        messages={chatScenarios[selectedScenario].messages} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center"
          >
            <a 
              href="/about"
              className="btn btn-outline border-amber-900 text-amber-900 hover:bg-amber-900 hover:text-white"
            >
              Start with a text
            </a>
          </motion.div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />
    </>
  );
}