'use client';

import { motion } from 'framer-motion';
import { ScrollAnimationWrapper } from '@/app/hooks/useScrollAnimation';
import AnimatedChat from '@/app/components/AnimatedChat';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const scenarios = {
  onboarding: [
    { "id": 1, "text": "Hi! I'm here to support you. What's your name?", "isUser": false },
    { "id": 2, "text": "Sarah", "isUser": true },
    { "id": 3, "text": "Nice to meet you, Sarah. Who are you caring for?", "isUser": false },
    { "id": 4, "text": "My mom", "isUser": true },
    { "id": 5, "text": "I appreciate you being here for your mom. How long have you been caring for her?", "isUser": false },
    { "id": 6, "text": "About 2 years now", "isUser": true },
    { "id": 7, "text": "That's a significant commitment. To find local resources near you, what's your zip code?", "isUser": false },
    { "id": 8, "text": "94103", "isUser": true },
    { "id": 9, "text": "Perfect. Let's do a quick check-in to see how you're doing.", "isUser": false },
    { "id": 10, "text": "ok", "isUser": true },
  ],
  dailyCheckin: [
    { "id": 1, "text": "Morning! Quick check-in. How are you feeling right now?", "isUser": false },
    { "id": 2, "text": "Honestly? Not great", "isUser": true },
    { "id": 3, "text": "I hear you. How overwhelming does caregiving feel today?", "isUser": false },
    { "id": 4, "text": "Pretty overwhelming", "isUser": true },
    { "id": 5, "text": "How stressed do you feel right now?", "isUser": false },
    { "id": 6, "text": "Very stressed", "isUser": true },
    { "id": 7, "text": "Your wellness score today: 45/100 (Managing, but challenging)", "isUser": false },
    { "id": 8, "text": "Top pressure: Emotional strain. Quick strategy: 2-min breathing exercise can help. Want it? Reply YES.", "isUser": false },
    { "id": 9, "text": "yes", "isUser": true },
    { "id": 10, "text": "Box breathing: Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 3x. Helps reset your nervous system.", "isUser": false },
    { "id": 11, "text": "Found a caregiver support group meeting tonight at 7pm. Interested?", "isUser": false },
    { "id": 12, "text": "maybe, send me the details", "isUser": true },
  ],
  respite: [
    { "id": 1, "text": "I haven't left the house in 3 weeks", "isUser": true },
    { "id": 2, "text": "I just snapped at my kids for no reason", "isUser": true },
    { "id": 3, "text": "When did you last have time away from caregiving?", "isUser": false },
    { "id": 4, "text": "I can't remember", "isUser": true },
    { "id": 5, "text": "There's no one to watch mom", "isUser": true },
    { "id": 6, "text": "Let me find respite services near you", "isUser": false },
    { "id": 7, "text": "Found 3 respite services in your area", "isUser": false },
    { "id": 8, "text": "Two offer same-day bookings", "isUser": false },
    { "id": 9, "text": "ElderCare @ Home: (415) 555-0100", "isUser": false },
    { "id": 10, "text": "Comfort Keepers: (415) 555-0234", "isUser": false },
    { "id": 11, "text": "thanks, i'll check it out", "isUser": true },
  ],
  crisis: [
    { "id": 1, "text": "I don't know if I can do this anymore", "isUser": true },
    { "id": 2, "text": "I hear you. That sounds overwhelming. Are you safe right now?", "isUser": false },
    { "id": 3, "text": "I think so", "isUser": true },
    { "id": 4, "text": "just overwhelmed", "isUser": true },
    { "id": 5, "text": "It's okay to feel overwhelmed. You're doing something incredibly hard.", "isUser": false },
    { "id": 6, "text": "If you need to talk to someone right now:", "isUser": false },
    { "id": 7, "text": "988 Suicide & Crisis Lifeline", "isUser": false },
    { "id": 8, "text": "Crisis Text Line: Text HOME to 741741", "isUser": false },
    { "id": 9, "text": "911 for emergencies", "isUser": false },
    { "id": 10, "text": "I'm here too. What do you need right now?", "isUser": false },
    { "id": 11, "text": "just someone to listen", "isUser": true },
  ],
  financial: [
    { "id": 1, "text": "I can't afford her medications this month", "isUser": true },
    { "id": 2, "text": "The bills keep piling up", "isUser": true },
    { "id": 3, "text": "Let me help find financial assistance. What medications does she need?", "isUser": false },
    { "id": 4, "text": "Blood pressure and diabetes meds", "isUser": true },
    { "id": 5, "text": "Found 3 prescription assistance programs:", "isUser": false },
    { "id": 6, "text": "RxAssist: Free meds for qualifying patients", "isUser": false },
    { "id": 7, "text": "NeedyMeds: Up to 80% off", "isUser": false },
    { "id": 8, "text": "Medicare Extra Help: (800) 772-1213", "isUser": false },
    { "id": 9, "text": "thanks", "isUser": true },
  ],
};

const whatYouGet = [
  {
    title: "Immediate support, anytime",
    description: "Text when you need help. Get a response in seconds, not hours. No appointments, no waiting."
  },
  {
    title: "Resources matched to your exact situation",
    description: "Respite care, meals, transport, home care, day programs, hospice, memory care, legal help, financial aid, and support groups—all matched to your needs and location."
  },
  {
    title: "Evidence-based micro-interventions",
    description: "Quick strategies (2-10 min) matched to your pressure zones. Breathing exercises for emotional strain, respite planning for physical exhaustion, boundary scripts for self-care neglect."
  },
  {
    title: "Your burnout score tracked over time",
    description: "See your progress over time. Notice patterns that help you recognize when additional support might be useful."
  },
  {
    title: "Safety support when you need it",
    description: "If you're in crisis, we connect you immediately with 988 Suicide & Crisis Lifeline and other support resources. We follow up the next day to see how you're doing."
  }
];

export default function HowItWorksPage() {
  const [activeScenario, setActiveScenario] = useState<keyof typeof scenarios>('onboarding');

  return (
    <>
        {/* Hero Section */}
        <section className="section-hero bg-gradient-to-b from-base-100 to-base-100 pb-24">
          <div className="container-editorial">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="heading-hero mb-6">
                Finally, support that gets it
              </h1>
              <p className="body-large mb-8">
                Text your reality. Get real help. Track real progress.
              </p>

              {/* Scenario Tabs */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <button
                  onClick={() => setActiveScenario('onboarding')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeScenario === 'onboarding'
                      ? 'bg-amber-950 text-white'
                      : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Getting Started
                </button>
                <button
                  onClick={() => setActiveScenario('dailyCheckin')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeScenario === 'dailyCheckin'
                      ? 'bg-amber-950 text-white'
                      : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Daily Check-in
                </button>
                <button
                  onClick={() => setActiveScenario('respite')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeScenario === 'respite'
                      ? 'bg-amber-950 text-white'
                      : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Finding Resources
                </button>
                <button
                  onClick={() => setActiveScenario('crisis')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeScenario === 'crisis'
                      ? 'bg-amber-950 text-white'
                      : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Crisis Support
                </button>
                <button
                  onClick={() => setActiveScenario('financial')}
                  className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    activeScenario === 'financial'
                      ? 'bg-amber-950 text-white'
                      : 'bg-white text-amber-950 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Financial Help
                </button>
              </div>

              {/* Phone Demo */}
              <div className="flex justify-center mt-8 mb-4">
                <div className="transform scale-[0.8] md:scale-[0.85]">
                  <div className="mockup-phone border-amber-800">
                    <div className="mockup-phone-camera"></div>
                    <div className="mockup-phone-display relative">
                      <Image
                        src="/phone.jpg"
                        alt="Phone background"
                        width={1179}
                        height={2556}
                        className="w-full h-full object-cover"
                      />

                      {/* Chat Messages - positioned below the gray header and GiveCare title */}
                      <motion.div
                        key={activeScenario}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-x-0 top-[160px] bottom-0 px-4 pt-3 pb-4 overflow-y-auto"
                      >
                        <AnimatedChat messages={scenarios[activeScenario]} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* You Can't Fix What You Can't Measure */}
        <section className="section-standard bg-amber-950">
          <div className="container-editorial">
            <ScrollAnimationWrapper variant="fadeInUp">
              <div className="max-w-3xl mx-auto">
                <h2 className="heading-section-dark mb-6 text-center">
                  Understanding your burden helps you address it
                </h2>
                <div className="space-y-6 text-amber-100">
                  <p className="text-xl text-center font-light">
                    Caregiver stress can build gradually. Early support helps you notice patterns and find resources when you need them.
                  </p>
                  <p className="text-lg font-light">
                    GC-SDOH-28 measures the invisible—financial strain, isolation, access to care, housing quality, community support. The real-world factors that affect your wellbeing.
                  </p>
                  <div className="card-editorial-dark border-l-4 border-amber-100">
                    <p className="font-semibold text-amber-50 mb-2">Your score is your starting line.</p>
                    <p className="text-amber-100">
                      Week by week, we track changes. When the number drops, you can see: things are getting better. When it climbs, we find more support before things feel overwhelming.
                    </p>
                  </div>
                  <p className="text-center text-amber-100 italic">
                    28 questions. 2 minutes. A way to see and track what you're experiencing.
                  </p>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>

        {/* Clinical Foundation */}
        <section className="section-standard bg-base-100">
          <div className="container-editorial">
            <ScrollAnimationWrapper variant="fadeInUp">
              <div className="text-center mb-12">
                <h2 className="heading-section mb-6">
                  Built on decades of caregiving research
                </h2>
              </div>
            </ScrollAnimationWrapper>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <ScrollAnimationWrapper variant="scaleIn">
                <div className="card-editorial text-center">
                  <h3 className="text-lg font-normal text-amber-950 mb-2">REACH-II</h3>
                  <p className="text-sm text-amber-700 font-light">NIH-validated caregiving assessment</p>
                  <p className="text-xs text-amber-600 mt-2 font-light">Coordinated by University of Pittsburgh</p>
                </div>
              </ScrollAnimationWrapper>
              <ScrollAnimationWrapper variant="scaleIn" delay={150}>
                <div className="card-editorial text-center">
                  <h3 className="text-lg font-normal text-amber-950 mb-2">GC-SDOH-28</h3>
                  <p className="text-sm text-amber-700 font-light">
                    <Link href="/words/care-sdoh" className="hover:text-amber-950 underline underline-offset-2 transition-colors">
                      Evidence-based wellness framework
                    </Link>
                  </p>
                  <p className="text-xs text-amber-600 mt-2 font-light">Created by GiveCare</p>
                </div>
              </ScrollAnimationWrapper>
              <ScrollAnimationWrapper variant="scaleIn" delay={300}>
                <div className="card-editorial text-center">
                  <h3 className="text-lg font-normal text-amber-950 mb-2">CWBS</h3>
                  <p className="text-sm text-amber-700 font-light">Caregiver Well-Being Scale</p>
                  <p className="text-xs text-amber-600 mt-2 font-light">© 1993 Susan Tebb, Saint Louis University</p>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="section-standard bg-base-100">
          <div className="container-editorial">
            <ScrollAnimationWrapper variant="fadeInUp">
              <div className="max-w-3xl mx-auto">
                <h2 className="heading-section mb-6 text-center">
                  Built in the open
                </h2>
                <div className="space-y-6">
                  <p className="body-large text-center">
                    Sharing our work helps everyone caring for others.
                  </p>
                  <div className="card-editorial">
                    <p className="text-amber-700 font-light mb-4">
                      Caregiving shouldn't be solved in silos. We're sharing what we learn—assessment frameworks,
                      research insights, clinical approaches, and implementation strategies—so other organizations
                      can adapt and improve on our work. Share your insights. Collaborate on solutions. Together,
                      we can make caregiving support better for everyone.
                    </p>
                    <p className="text-amber-700 font-light">
                      From evidence-based frameworks to open code, we believe in radical transparency and knowledge
                      sharing. The more we collaborate, the faster we can improve support for millions caring for loved ones.
                    </p>
                  </div>
                  <div className="text-center">
                    <a
                      href="https://github.com/orgs/givecareapp/repositories"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-editorial-primary inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      Explore & Contribute on GitHub
                    </a>
                  </div>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>

        {/* What You Get */}
        <section className="section-standard bg-gradient-to-b from-base-100 to-base-100">
          <div className="container-editorial">
            <ScrollAnimationWrapper variant="fadeInUp">
              <div className="text-center mb-12">
                <h2 className="heading-section mb-4">
                  What you actually get
                </h2>
                <p className="body-large max-w-2xl mx-auto">
                  Real support, not just conversation
                </p>
              </div>
            </ScrollAnimationWrapper>

            <div className="max-w-2xl mx-auto space-y-6">
              {whatYouGet.map((item, index) => (
                <ScrollAnimationWrapper
                  key={index}
                  variant="fadeInUp"
                  delay={index * 100}
                >
                  <div className="card-editorial">
                    <h3 className="text-lg font-normal text-amber-950 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-amber-700 font-light">
                      {item.description}
                    </p>
                  </div>
                </ScrollAnimationWrapper>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-amber-950">
          <div className="container-editorial">
            <ScrollAnimationWrapper variant="fadeInUp">
              <div className="max-w-4xl mx-auto text-center section-standard">
                <h2 className="heading-section-dark mb-4">Ready to see where you're at?</h2>
                <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto font-light">
                  Take the free assessment. Get your score. See what support looks like.
                </p>
                <div className="pb-0">
                  <a
                    href="/assessment"
                    className="btn-editorial-secondary"
                  >
                    Start Free Assessment
                  </a>
                </div>
              </div>
            </ScrollAnimationWrapper>
          </div>
        </section>
    </>
  );
}