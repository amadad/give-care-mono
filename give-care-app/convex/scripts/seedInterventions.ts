/**
 * Seed Interventions
 * 16 evidence-based micro-interventions mapped to zones (P1-P6)
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const INTERVENTIONS = [
  {
    title: "4‑7‑8 Breathing",
    description: "Brief paced breathing to reduce arousal.",
    category: "breathing",
    targetZones: ["P6"],
    evidenceLevel: "moderate" as const,
    duration: "2-4 min",
    tags: ["anxiety", "sleep"],
    content: "Exhale fully. Inhale 4, hold 7, exhale 8. Repeat 4 cycles.",
  },
  {
    title: "Box Breathing",
    description: "Even counts to steady the nervous system.",
    category: "breathing",
    targetZones: ["P6"],
    evidenceLevel: "moderate" as const,
    duration: "2-3 min",
    tags: ["stress"],
    content: "Inhale 4, hold 4, exhale 4, hold 4. Repeat 4–6 times.",
  },
  {
    title: "2‑Minute Reframe",
    description: "Challenge an all‑or‑nothing thought.",
    category: "cognitive_reframe",
    targetZones: ["P6"],
    evidenceLevel: "moderate" as const,
    duration: "2-3 min",
    tags: ["cognition"],
    content: "Write the thought. Ask: evidence for/against? More balanced view in one sentence.",
  },
  {
    title: "Tiny Respite Plan",
    description: "Plan a 15‑minute break today.",
    category: "behavioral_activation",
    targetZones: ["P1", "P3"],
    evidenceLevel: "moderate" as const,
    duration: "3-5 min",
    tags: ["burnout"],
    content: "Pick a 15‑min slot today. Choose 1 activity (walk, tea, music). Put it on your calendar.",
  },
  {
    title: "10‑Minute Walk",
    description: "Low‑dose movement to lift mood.",
    category: "movement",
    targetZones: ["P2"],
    evidenceLevel: "high" as const,
    duration: "10 min",
    tags: ["energy", "sleep"],
    content: "Walk at a comfortable pace; notice 5 sights, 4 sounds, 3 sensations.",
  },
  {
    title: "Hydration Reset",
    description: "Quick hydration cue.",
    category: "self_care_basics",
    targetZones: ["P2"],
    evidenceLevel: "low" as const,
    duration: "1 min",
    tags: ["fatigue"],
    content: "Drink a full glass of water now. Optional: set a 3‑hour reminder.",
  },
  {
    title: "Body Scan (Short)",
    description: "Downshift muscle tension.",
    category: "mindfulness",
    targetZones: ["P1", "P2"],
    evidenceLevel: "moderate" as const,
    duration: "5 min",
    tags: ["tension", "sleep"],
    content: "Scan head→toes; on each out‑breath, soften that area 5%.",
  },
  {
    title: "Ask for One Thing",
    description: "Low‑friction help request.",
    category: "communication",
    targetZones: ["P1"],
    evidenceLevel: "moderate" as const,
    duration: "3 min",
    tags: ["support"],
    content: 'Text a trusted person: "Could you [specific 10‑min task] this week? It would really help."',
  },
  {
    title: "Two‑Column Problem Solve",
    description: "Clarify a practical barrier.",
    category: "problem_solving",
    targetZones: ["P3", "P4"],
    evidenceLevel: "moderate" as const,
    duration: "5-8 min",
    tags: ["planning"],
    content: "Column A: barriers; Column B: smallest next step for each. Pick one to do today.",
  },
  {
    title: "Medication Timer Setup",
    description: "Simplify med timing.",
    category: "care_routine",
    targetZones: ["P5"],
    evidenceLevel: "low" as const,
    duration: "5-8 min",
    tags: ["adherence"],
    content: "Set two daily alarms named for the medication. Place meds near the item you never forget.",
  },
  {
    title: "Home‑Safety Sweep",
    description: "Reduce fall risk quickly.",
    category: "home_safety",
    targetZones: ["P5"],
    evidenceLevel: "moderate" as const,
    duration: "10 min",
    tags: ["falls"],
    content: "Clear floor hazards in bathroom/hall. Check night‑light, rug edges, cords.",
  },
  {
    title: "Benefits Check Starter",
    description: "Start a benefits check.",
    category: "resources_financial",
    targetZones: ["P4"],
    evidenceLevel: "low" as const,
    duration: "5-10 min",
    tags: ["finance"],
    content: "Gather ZIP code + basic income; open benefits.gov or local AAA site; note 1 program to apply.",
  },
  {
    title: "Day Program Inquiry",
    description: "Scout a respite day program.",
    category: "resources_day_programs",
    targetZones: ["P3", "P5"],
    evidenceLevel: "low" as const,
    duration: "5 min",
    tags: ["respite"],
    content: "Search \"adult day program near me\"; shortlist 2; note phone/email for outreach.",
  },
  {
    title: "Gratitude Micro‑Note",
    description: "Brief mood lift via savoring.",
    category: "savoring",
    targetZones: ["P1"],
    evidenceLevel: "moderate" as const,
    duration: "2 min",
    tags: ["mood"],
    content: "Write one sentence about something that went okay today. Text it to yourself.",
  },
  {
    title: "Care Log Template",
    description: "Reduce cognitive load.",
    category: "organization",
    targetZones: ["P5", "P6"],
    evidenceLevel: "low" as const,
    duration: "5 min",
    tags: ["memory", "handoff"],
    content: "Create a simple daily log: meds, meals, mood, mobility. Snap a photo to share with helpers.",
  },
  {
    title: "Wind‑Down Cue",
    description: "Consistent pre‑sleep routine.",
    category: "sleep_hygiene",
    targetZones: ["P1", "P2"],
    evidenceLevel: "moderate" as const,
    duration: "5-10 min",
    tags: ["sleep"],
    content: "Pick 2 steps (dim lights, warm shower, no screens). Do them at the same time nightly.",
  },
];

/**
 * Seed interventions into database
 * Run this once to populate interventions table
 */
export const seedInterventions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if interventions already exist
    const existing = await ctx.db.query("interventions").first();
    if (existing) {
      return { message: "Interventions already seeded", count: 0 };
    }

    let count = 0;
    for (const intervention of INTERVENTIONS) {
      // Insert intervention
      const interventionId = await ctx.db.insert("interventions", {
        title: intervention.title,
        description: intervention.description,
        category: intervention.category,
        targetZones: intervention.targetZones,
        evidenceLevel: intervention.evidenceLevel,
        duration: intervention.duration,
        tags: intervention.tags,
        content: intervention.content,
      });

      // Insert zone mappings
      for (const zone of intervention.targetZones) {
        await ctx.db.insert("intervention_zones", {
          interventionId,
          zone,
        });
      }

      count++;
    }

    return { message: `Seeded ${count} interventions`, count };
  },
});

