'use client';

import { ScrollAnimationWrapper } from '../../hooks/useScrollAnimation';
import BurnoutGauge from '../ui/BurnoutGauge';
import PressureZones, { PressureZone } from '../ui/PressureZones';
import MilestoneTimeline, { Milestone } from '../ui/MilestoneTimeline';
import VideoPlayer from '../ui/VideoPlayer';

// Example data
const examplePressureZones: PressureZone[] = [
  { name: "Financial", severity: "high", description: "Bills, insurance, employment concerns" },
  { name: "Emotional", severity: "moderate", description: "Anxiety, depression, grief" },
  { name: "Physical", severity: "low", description: "Sleep, exercise, health" },
];

const exampleMilestones: Milestone[] = [
  { day: 30, status: "completed", date: "Jan 15", title: "First Check-in" },
  { day: 90, status: "in-progress", daysRemaining: 23, title: "Progress Review" },
  { day: 180, status: "upcoming", title: "Milestone" },
  { day: 365, status: "upcoming", title: "One Year" },
];

export default function BurnoutScoreSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-amber-50/30 to-base-100">
      <div className="container mx-auto px-4">
        <ScrollAnimationWrapper variant="fadeInUp">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto" />
            </div>
            <h2 className="text-4xl md:text-5xl font-serif text-amber-950 mb-4">
              Watch your stress drop week by week
            </h2>
            <p className="text-xl text-amber-800 max-w-2xl mx-auto">
              Your burnout score tracks improvement over time
            </p>
          </div>
        </ScrollAnimationWrapper>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Burnout Gauge */}
            <ScrollAnimationWrapper variant="scaleIn" delay={200}>
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-amber-100">
                <BurnoutGauge
                  currentScore={67}
                  targetScore={85}
                  trend="improving"
                  band="Moderate"
                  showSparkline={true}
                  sparklineData={[72, 70, 69, 67]}
                />

                <div className="mt-8 text-center">
                  <VideoPlayer
                    title="How Burnout Tracking Works"
                    duration="0:30"
                    className="w-full"
                  />
                </div>
              </div>
            </ScrollAnimationWrapper>

            {/* Right: Pressure Zones + Milestones */}
            <div className="space-y-8">
              <ScrollAnimationWrapper variant="fadeInUp" delay={400}>
                <div>
                  <h3 className="text-2xl font-serif text-amber-950 mb-4">
                    Your Top Pressure Zones
                  </h3>
                  <p className="text-amber-800 mb-6">
                    We identify what's driving your stress, so strategies can target the real problem.
                  </p>
                  <PressureZones
                    zones={examplePressureZones}
                    showDescription={true}
                    layout="grid"
                  />
                </div>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper variant="fadeInUp" delay={600}>
                <div>
                  <h3 className="text-2xl font-serif text-amber-950 mb-4">
                    Celebrate Milestones
                  </h3>
                  <p className="text-amber-800 mb-6">
                    Track your progress at 30, 90, 180, and 365 days.
                  </p>
                  <MilestoneTimeline milestones={exampleMilestones} />
                </div>
              </ScrollAnimationWrapper>

              <ScrollAnimationWrapper variant="fadeInUp" delay={800}>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h4 className="font-semibold text-amber-950 mb-2">
                    Why measuring matters
                  </h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Generic wellness apps ask "How are you feeling?" (1-10). We use clinical assessments
                    to calculate a precise burnout score, identify pressure zones, and prove you're improving.
                    You can't manage what you don't measure.
                  </p>
                  <div className="text-xs text-amber-700 border-t border-amber-200 pt-3">
                    <strong>Based on the BSFC</strong> (Burden Scale for Family Caregivers) — a clinically validated
                    tool developed by Erlangen University Hospital and used across Europe in 20 languages.
                  </div>
                </div>
              </ScrollAnimationWrapper>
            </div>
          </div>

          {/* CTA */}
          <ScrollAnimationWrapper variant="fadeInUp" delay={1000}>
            <div className="text-center mt-12">
              <a
                href="/assessment"
                className="btn btn-lg bg-amber-900 text-white hover:bg-amber-800 border-none shadow-lg"
              >
                Start Your Free Wellness Check
              </a>
              <p className="text-sm text-amber-600 mt-4">
                Takes under 3 minutes · No credit card required
              </p>
            </div>
          </ScrollAnimationWrapper>
        </div>
      </div>
    </section>
  );
}
