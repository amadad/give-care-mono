'use client';

import AnimatedChat from "../AnimatedChat";
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

const steps = [
  {
    number: "1",
    title: "Clinical assessment via SMS",
    description: "BSFC questionnaire. Takes 3 minutes. Calculates your burnout score.",
  },
  {
    number: "2",
    title: "Track progress weekly",
    description: "See your score improve. Sparklines show trends. Milestones celebrate wins.",
  },
  {
    number: "3",
    title: "Evidence-based strategies",
    description: "Matched to your pressure zones. Proven interventions. Measurable results.",
  }
];

const chatMessages = [
  { "id": 1, "text": "I haven't left the house in 3 weeks. I just snapped at my kids for no reason.", "isUser": true },
  { "id": 2, "text": "When did you last have time away from caregiving?", "isUser": false },
  { "id": 3, "text": "I can't remember. There's no one to watch mom.", "isUser": true },
  { "id": 4, "text": "Found 3 respite services in your area. Two offer same-day bookings.", "isUser": false },
];

export default function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section-standard bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="heading-section">
            How it works
          </h2>
        </div>

        <div className="space-y-12 md:space-y-14">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-6 md:gap-8">
              {/* Number */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 flex items-center justify-center">
                  <span className="text-xl md:text-2xl font-serif font-light text-amber-700">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <h3 className="text-base md:text-lg font-normal text-amber-950 mb-2 tracking-wide">
                  {step.title}
                </h3>
                <p className="text-sm text-amber-700 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Phone Demo */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
          className="flex justify-center mt-16 md:mt-20"
        >
          <div className="transform scale-75 md:scale-90">
            <div className="mockup-phone border-amber-800 shadow-sm">
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
                    <AnimatedChat messages={chatMessages} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}