'use client';

import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import CTA from '@/app/components/sections/CTA';
import { motion } from 'framer-motion';

export default function AboutPage() {

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section - Letter from Founder */}
        <section className="section-hero bg-base-100">
          <div className="container-editorial">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-2xl mx-auto mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-serif font-light text-amber-950 mb-6">
                Built by Caregivers,<br />for Caregivers
              </h1>
              <p className="body-large mb-12">
                <a href="https://www.givecareapp.com/words/caregiving-in-america-2025" className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors">
                  63 million Americans are family caregivers
                </a>. We see you.
              </p>
            </motion.div>

            {/* Letter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="font-serif text-xl md:text-2xl leading-relaxed text-amber-950 space-y-8">
                <p>
                  Seven years. Two parents. One realization: the system isn't built for caregivers—it's built around them.
                </p>
                <p>
                  After my parents died, I couldn't shake a question: What if I'd had something that actually understood what I was going through?
                </p>
                <p>
                  I had a close support circle. I had family. But if you've been a caregiver, you know the despair—the invisible weight that's hard to explain, even to those who love you. The decisions nobody prepares you for. You don't know what you don't know. The exhaustion that goes bone-deep.
                </p>
                <p>
                  I didn't need another app to manage tasks. I didn't need fake empathy from a chatbot. I needed a tool that learned my situation and helped me stay grounded before burnout set in. Something that complemented the support I had—not replaced it.
                </p>
                <p>
                  That's why GiveCare doesn't try to be your friend. It's a tool. A companion. Something that remembers your story, tracks your stress patterns, and finds real resources when you need them—not when you remember to ask.
                </p>
                <p>
                  No app. No login. Just text when you need support. Because at 2 AM when you're exhausted and alone, you don't need another password. You need someone who gets it.
                </p>
                <p>
                  We built this for the caregiver who's drowning in invisible labor. The one nobody sees. The one who can't pour from an empty cup.
                </p>
                <p>
                  This is for you.
                </p>
                <div className="mt-16 pt-8 border-t border-amber-200">
                  <p className="text-base">— Ali Madad, Founder</p>
                  <p className="text-base text-amber-700">Board-Certified Patient Advocate</p>
                  <p className="text-base text-amber-700">Mentor, I AM ALS</p>
                  <p className="text-base text-amber-700">Member, Alliance of Professional Health Advocates</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-standard bg-base-100">
          <div className="container-editorial">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="heading-section text-center mb-4">Questions We Get</h2>
              <p className="body-standard text-center mb-12">Honest answers about what GiveCare is (and isn't)</p>
              
              <div className="join join-vertical w-full">
                {/* How is this different than ChatGPT? */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" defaultChecked />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    How is this different than ChatGPT?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4 space-y-3">
                      <p><strong>Gets Smarter About YOUR Caregiving:</strong> While ChatGPT has general memory, GiveCare learns YOUR specific patterns - when you're stressed, what triggers bad days, which strategies work for you.</p>
                      <p><strong>Personalized Resources:</strong> Not just "info about dementia" but "the Tuesday respite program 10 minutes from you that takes Medicaid."*</p>
                      <p><strong>Clinical Tracking:</strong> We use validated assessments (REACH II, CWBS) you can visualize in a journey*. Real data, not just chat.</p>
                      <p><strong>SMS + Proactive:</strong> Works via text on any phone. We check on you based on your caregiving phase - you don't have to remember to ask for help.</p>
                      <p className="italic">Bottom line: ChatGPT is a brilliant library. GiveCare is a caregiving coach that learns your situation and proactively supports you.</p>
                      <p className="italic">*coming soon</p>
                    </div>
                  </div>
                </div>

                {/* Is this just another chatbot? */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    Is this just another chatbot that will frustrate me?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Fair question. Yes, GiveCare is AI-powered, which means it has limitations. It can't replace human judgment, won't always understand complex situations perfectly, and sometimes might miss nuances.</p>
                      <p className="mt-3">What it CAN do: remember your entire story, respond instantly at 3 AM, never judge you, and connect you to proven resources. Think of it as a very knowledgeable assistant, not a replacement for human connection.</p>
                    </div>
                  </div>
                </div>

                {/* What if I'm not a technology person? */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    What if I'm not a "technology person"?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Perfect - neither are many of our users. If you can send a text message, you can use GiveCare. No apps, no downloads, no accounts. It works on flip phones, old smartphones, whatever you have.</p>
                      <p className="mt-3">The technology is invisible - it just feels like texting with someone who really understands.</p>
                    </div>
                  </div>
                </div>

                {/* How do I know this is safe? */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    How do I know this is actually safe to use?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Valid concern. We use the same assessments trusted by major research hospitals (REACH II, Caregiver Well-Being Scale). We're NOT medical providers and clearly state that.</p>
                      <p className="mt-3">For emergencies, we'll always direct you to 911. For mental health crises, we recommend 988. We can't prescribe medications or diagnose conditions. What we can do is provide evidence-based emotional support and help you find real resources.</p>
                    </div>
                  </div>
                </div>

                {/* Privacy concerns */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    What happens to my deeply personal conversations?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Your privacy concerns are valid. Your conversations are encrypted and stored securely. You can delete everything instantly. We don't sell data or share with insurance companies.</p>
                      <p className="mt-3">That said, we're a small company - if we were ever acquired, we'd notify you immediately. You own your data and can export it anytime. We're transparent: this is a business, but one built on trust.</p>
                    </div>
                  </div>
                </div>

                {/* Will this actually help? */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    Will this actually make a difference or is it just nice words?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Consider this: 40-70% of caregivers experience clinical depression. 59% report their health has gotten worse due to caregiving. Caregiver burnout increases hospitalization rates by 23%.</p>
                      <p className="mt-3">GiveCare exists to mitigate caregiver burden. We give caregivers a safe space that focuses on YOU - not just your loved one. This is care for caregivers, made by caregivers who understand what you're going through.</p>
                      <p className="mt-3">We help in ways not found elsewhere because we remember your story, track your stress patterns, and proactively check in when you need it most. It's about preventing burnout before it happens.</p>
                    </div>
                  </div>
                </div>

                {/* Cost concerns */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    I don't have money for another subscription
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>We understand - caregiving is expensive. GiveCare costs less than a single hour of respite care per month. Contact your local insurer to see if they can cover it. If you're in crisis, we have grace periods and won't cut you off.</p>
                      <p className="mt-3">That said, if money is truly tight, local Area Agency on Aging services are free. We're here if you need 24/7 support that remembers your story, but we're honest that free alternatives exist.</p>
                    </div>
                  </div>
                </div>

                {/* No app needed */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    Do I need to download an app?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>No! GiveCare works through regular SMS text messaging. No apps, no usernames, no passwords. Works on any phone - smartphone or flip phone.</p>
                      <p className="mt-3">Just text us to get started. Enhanced features (like rich cards) available on newer phones, but not required.</p>
                    </div>
                  </div>
                </div>

                {/* Response time */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    How fast will I get responses?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>It's just like texting a friend - instant responses, available 24/7, including holidays. No waiting on hold or scheduling appointments. Support whenever you need it.</p>
                    </div>
                  </div>
                </div>

                {/* Crisis handling */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    What happens in a crisis?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>Emergency keyword detection triggers immediate response. We provide clear guidance to call 911 for emergencies. Grace periods ensure you're never cut off during crisis. Safety protocols are built into every interaction.</p>
                      <p className="mt-3 text-sm italic">Note: Direct human escalation is not currently available. We always recommend 911 for emergencies and 988 for mental health crises.</p>
                    </div>
                  </div>
                </div>

                {/* Wrong information */}
                <div className="collapse collapse-arrow join-item border border-amber-700">
                  <input type="radio" name="faq-accordion" />
                  <div className="collapse-title text-lg font-medium text-amber-950">
                    What if it says something wrong or harmful?
                  </div>
                  <div className="collapse-content text-amber-800">
                    <div className="pt-4">
                      <p>This is a new area, and we're helping to explore and pioneer the safe and ethical deployment of AI technology in caregiving. We're actively defining what appropriate boundaries look like for AI companions in healthcare support.</p>
                      <p className="mt-3">It's important to remember: these systems are not humans. They're advanced tools that can provide evidence-based support and resources, but they operate within defined parameters. We use validated assessments, always recommend professional help when appropriate, and continuously improve based on feedback.</p>
                      <p className="mt-3">If GiveCare ever provides concerning advice, please report it immediately. We're committed to responsible AI deployment in this sensitive space.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Email Signup CTA */}
        <CTA />

      </main>
      <Footer />
    </div>
  );
}