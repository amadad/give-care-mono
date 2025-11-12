/**
 * Evidence-Based Intervention Seed Data
 * 
 * 16 caregiver support strategies with evidence levels and zone mappings.
 * Based on clinical literature: RCTs, observational studies, and expert consensus.
 */

export interface InterventionSeed {
  title: string;
  description: string;
  category: string;
  targetZones: string[];
  evidenceLevel: 'high' | 'moderate' | 'low';
  duration: string;
  tags: string[];
  content: string;
}

export const INTERVENTION_SEEDS: InterventionSeed[] = [
  {
    title: "4-7-8 Breathing Exercise",
    description: "A simple breathing technique to reduce stress and anxiety by activating the body's relaxation response",
    category: "breathing",
    targetZones: ["emotional", "physical"],
    evidenceLevel: "high",
    duration: "2-5 min",
    tags: ["breathing", "stress", "anxiety", "quick", "relaxation"],
    content: "Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times. This activates your body's relaxation response and can be done anywhere, anytime you feel overwhelmed.",
  },
  {
    title: "Respite Planning",
    description: "Schedule regular breaks from caregiving to prevent burnout and maintain your own health",
    category: "respite",
    targetZones: ["time", "physical", "emotional"],
    evidenceLevel: "high",
    duration: "15-30 min",
    tags: ["respite", "planning", "self-care", "boundaries"],
    content: "Block 1-2 hours this week where someone else covers caregiving. Write it in your calendar as non-negotiable. Even 30 minutes helps. Consider: family, friends, paid respite, adult day care, or support groups that offer respite.",
  },
  {
    title: "Support Group Connection",
    description: "Connect with other caregivers who understand your experience and can offer practical and emotional support",
    category: "support_group",
    targetZones: ["social", "emotional"],
    evidenceLevel: "high",
    duration: "1+ hour",
    tags: ["support", "community", "connection", "isolation"],
    content: "Join a caregiver support group—in-person or online. Share your experience, learn from others, and reduce isolation. Many groups meet weekly and offer both emotional support and practical tips. I can help you find one near you.",
  },
  {
    title: "Micro-Breaks",
    description: "Take 2-5 minute breaks every 2 hours to prevent physical exhaustion and mental fatigue",
    category: "micro_breaks",
    targetZones: ["time", "physical"],
    evidenceLevel: "moderate",
    duration: "2-5 min",
    tags: ["breaks", "physical", "fatigue", "quick"],
    content: "Set a timer for every 2 hours. When it goes off, take 2-5 minutes to: stretch, step outside, drink water, or just breathe. These micro-breaks prevent exhaustion and help you stay present.",
  },
  {
    title: "Gratitude Journaling",
    description: "Write down 3 things you're grateful for each day to shift focus from stress to positive moments",
    category: "journaling",
    targetZones: ["emotional"],
    evidenceLevel: "moderate",
    duration: "2-5 min",
    tags: ["gratitude", "journaling", "emotional", "positive"],
    content: "Each evening, write down 3 things you're grateful for—even small moments count. This shifts your focus from stress to positive moments and can improve mood over time. Keep it simple: a text message to yourself works.",
  },
  {
    title: "Gentle Exercise Routine",
    description: "Regular light exercise improves physical health, reduces stress, and boosts energy",
    category: "exercise",
    targetZones: ["physical", "emotional"],
    evidenceLevel: "high",
    duration: "15-30 min",
    tags: ["exercise", "physical", "energy", "health"],
    content: "Aim for 15-30 minutes of gentle exercise 3x/week: walking, stretching, yoga, or chair exercises. Even 10 minutes helps. Exercise reduces stress, improves sleep, and boosts energy—all crucial for caregivers.",
  },
  {
    title: "Boundary Setting Scripts",
    description: "Learn to say no and set limits to protect your time and energy",
    category: "boundaries",
    targetZones: ["time", "emotional"],
    evidenceLevel: "moderate",
    duration: "5-10 min",
    tags: ["boundaries", "time", "saying-no", "self-care"],
    content: "Practice saying: 'I can't take on that right now' or 'Let me check my schedule and get back to you.' Setting boundaries protects your time and energy. You don't need to explain—a simple 'no' is enough.",
  },
  {
    title: "Sleep Hygiene Routine",
    description: "Establish consistent sleep habits to improve rest quality and reduce physical exhaustion",
    category: "sleep",
    targetZones: ["physical"],
    evidenceLevel: "high",
    duration: "30-60 min",
    tags: ["sleep", "physical", "rest", "routine"],
    content: "Create a bedtime routine: same sleep/wake times, no screens 1 hour before bed, cool dark room, relaxation (reading, breathing). Even if sleep is interrupted, a routine helps. Aim for 7-8 hours when possible.",
  },
  {
    title: "Meal Planning & Prep",
    description: "Plan and prep meals in advance to save time and ensure you're eating well",
    category: "meal_planning",
    targetZones: ["time", "physical"],
    evidenceLevel: "moderate",
    duration: "1+ hour",
    tags: ["meals", "planning", "time", "nutrition"],
    content: "Spend 1 hour on Sunday planning meals for the week. Prep ingredients or make simple meals ahead. Use slow cookers, batch cooking, or meal delivery services. Eating well saves time and energy—you can't pour from an empty cup.",
  },
  {
    title: "Financial Planning Checklist",
    description: "Organize financial resources and identify available benefits to reduce financial stress",
    category: "financial",
    targetZones: ["financial"],
    evidenceLevel: "moderate",
    duration: "30-60 min",
    tags: ["financial", "planning", "benefits", "resources"],
    content: "Create a financial checklist: review insurance coverage, identify tax deductions (medical expenses, dependent care), check for benefits (Medicaid, VA, local programs), and create a caregiving budget. Many resources exist—I can help you find them.",
  },
  {
    title: "Progressive Muscle Relaxation",
    description: "Systematically tense and relax muscle groups to reduce physical tension and stress",
    category: "relaxation",
    targetZones: ["physical", "emotional"],
    evidenceLevel: "moderate",
    duration: "5-10 min",
    tags: ["relaxation", "physical", "stress", "tension"],
    content: "Tense each muscle group for 5 seconds, then relax for 10 seconds. Start with feet, move up to head. This releases physical tension and calms the mind. Can be done sitting or lying down.",
  },
  {
    title: "Mindful Moments",
    description: "Practice brief mindfulness exercises to stay present and reduce anxiety",
    category: "mindfulness",
    targetZones: ["emotional"],
    evidenceLevel: "high",
    duration: "2-5 min",
    tags: ["mindfulness", "emotional", "anxiety", "present"],
    content: "Take 2-5 minutes to notice: 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, 1 thing you taste. This grounds you in the present moment and reduces anxiety.",
  },
  {
    title: "Caregiver Affirmations",
    description: "Use positive self-talk to combat guilt and validate your caregiving efforts",
    category: "affirmations",
    targetZones: ["emotional"],
    evidenceLevel: "low",
    duration: "1-2 min",
    tags: ["affirmations", "emotional", "guilt", "self-compassion"],
    content: "Repeat daily: 'I am doing my best' or 'It's okay to need help' or 'I deserve care too.' Caregiver guilt is common but unhelpful. These affirmations remind you that you're human and doing important work.",
  },
  {
    title: "Task Delegation List",
    description: "Identify tasks that can be delegated to reduce your workload and time pressure",
    category: "delegation",
    targetZones: ["time", "social"],
    evidenceLevel: "moderate",
    duration: "15-30 min",
    tags: ["delegation", "time", "help", "support"],
    content: "Make a list of all caregiving tasks. Mark which can be delegated: meal prep (family/friends), errands (neighbors), appointments (other family), housekeeping (paid help). Then ask for help—people want to help but don't know how.",
  },
  {
    title: "Emergency Contact Card",
    description: "Create a quick reference card with important contacts and information for emergencies",
    category: "organization",
    targetZones: ["time", "emotional"],
    evidenceLevel: "low",
    duration: "15-30 min",
    tags: ["organization", "emergency", "planning", "preparedness"],
    content: "Create a card with: doctor numbers, pharmacy, insurance info, medications list, emergency contacts. Keep it in your wallet and give copies to family. This reduces stress during emergencies—everything is in one place.",
  },
  {
    title: "Self-Compassion Break",
    description: "Practice self-compassion to reduce self-criticism and emotional exhaustion",
    category: "self_compassion",
    targetZones: ["emotional"],
    evidenceLevel: "moderate",
    duration: "2-5 min",
    tags: ["self-compassion", "emotional", "kindness", "guilt"],
    content: "When stressed, pause and say: 'This is a moment of suffering. Suffering is part of being human. May I be kind to myself.' Self-compassion reduces caregiver guilt and emotional exhaustion. You deserve kindness too.",
  },
];

