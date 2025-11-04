'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LaunchPressRelease() {
  return (
    <section className="section-standard bg-base-100">
      <div className="container-editorial">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <Link
            href="/press"
            className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors mb-6 inline-block"
          >
            ← Back to Press
          </Link>

          <article className="prose prose-lg max-w-none">
            <time className="text-sm text-amber-700 mb-4 block">
              November 4, 2025
            </time>

            <h1 className="heading-hero mb-8">
              GiveCare Releases First Open-Source AI Safety Framework for Family Caregivers with New Evaluation Benchmarks
            </h1>

            <p className="body-large font-bold mb-8">
              WASHINGTON, D.C. — November 4, 2025 — GiveCare, an AI-native startup dedicated to caregiver safety, today released two foundational preprints — GiveCare and SupportBench — ahead of this week's AgeTech Connect Summit in Atlanta and the Caregiver Action Network's Hill Day in Washington, during National Family Caregivers Month.
            </p>

            <div className="space-y-6 text-amber-950 font-serif text-lg leading-relaxed">
              <p>
                <a
                  href="https://github.com/givecareapp/givecare-bench/releases/download/v1.0-preprint/GiveCare.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                >
                  "GiveCare: An SMS-First, Multi-Agent Caregiving Assistant with SDOH Screening and Anticipatory Engagement" (PDF)
                </a>{' '}
                introduces a trauma-informed, privacy-safe AI system that turns any phone into a 24/7 support system that tracks caregiver burden and provides personalized resources.
              </p>

              <p>
                <a
                  href="https://github.com/givecareapp/givecare-bench/releases/download/v1.0-preprint/SupportBench.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                >
                  "SupportBench: A Deployment Gate for Caregiving Relationship AI" (PDF)
                </a>{' '}
                establishes the industry's first benchmark for longitudinal AI safety, validating systems for crisis detection, medical-boundary compliance, and cultural competence before real-world deployment.
              </p>

              <p>
                "We're building AI that protects caregivers, not just engages them," said Ali Madad, Founder of GiveCare and Board-Certified Patient Advocate (BCPA). "Our goal is to make every caregiving interaction safer — for families, clinicians, and the AI ecosystem itself."
              </p>

              <p>
                The open-source framework supports efforts to reauthorize the Older Americans Act (OAA), which funds vital nutrition, transportation, and caregiver support services for nearly 12 million older adults each year.
              </p>

              <p>
                Madad will advocate for OAA reauthorization during Hill Day on November 6, underscoring that technology is designed to complement — not replace — community care infrastructure.
              </p>

              <p>
                Caregiver stress and SDOH assessments are now available at{' '}
                <a
                  href="https://givecareapp.com/assessment"
                  className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                >
                  givecareapp.com/assessment
                </a>
                .
              </p>

              <hr className="my-8 border-amber-200" />

              <div className="bg-amber-50 p-6 rounded-lg space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-amber-950 mb-4">About GiveCare</h2>
                  <p>
                    GiveCare develops open, safety-focused AI systems for family caregivers. Its SMS-first assistant and evaluation frameworks enable healthcare organizations, researchers, and policymakers to deploy AI ethically and effectively in real-world care settings. All code and instruments are publicly available at{' '}
                    <a
                      href="https://github.com/givecareapp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      github.com/givecareapp
                    </a>{' '}
                    for community validation.
                  </p>
                  <p className="mt-2">
                    Learn more at{' '}
                    <a
                      href="https://givecareapp.com"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      GiveCareApp.com
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-amber-950 mb-4">About Ali Madad</h2>
                  <p>
                    Ali Madad, BCPA, is a designer-founder and AI engineer who creates systems that care. He leads{' '}
                    <a
                      href="https://scty.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      SCTY
                    </a>
                    , advising Fortune 500 companies on human-centered AI strategy and applied design. He serves as an advisor to{' '}
                    <a
                      href="https://www.majorchanges.org/bettergoodbye"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      A Better Goodbye
                    </a>
                    , a mentor with{' '}
                    <a
                      href="https://www.iamals.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      I AM ALS
                    </a>
                    , a policy member of the{' '}
                    <a
                      href="https://thectac.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      Coalition to Transform Advanced Care (C-TAC)
                    </a>
                    , a member of{' '}
                    <a
                      href="https://famtech.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      FamTech
                    </a>
                    , and a contributor to{' '}
                    <a
                      href="https://www.chai.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      Coalition for Health AI (CHAI)
                    </a>
                    . Madad holds five design patents and serves on the Software Safety Standards Panel at{' '}
                    <a
                      href="https://internetsafetylabs.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      Internet Safety Labs
                    </a>
                    .
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-amber-950 mb-4">Media Contact</h2>
                  <p>
                    <a
                      href="mailto:press@givecareapp.com"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      press@givecareapp.com
                    </a>
                  </p>
                  <p>
                    <a
                      href="https://givecareapp.com/press"
                      className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                    >
                      https://givecareapp.com/press
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </article>

          <div className="mt-12">
            <Link
              href="/press"
              className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
            >
              ← Back to Press
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
