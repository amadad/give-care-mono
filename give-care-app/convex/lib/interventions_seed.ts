/**
 * Evidence-based caregiver interventions
 *
 * Based on research from:
 * - BSFC (Burden Scale for Family Caregivers)
 * - AARP Family Caregiving Research
 * - National Alliance for Caregiving guidelines
 *
 * Target zones align with BSFC assessment:
 * - emotional: Emotional well-being and stress
 * - physical: Physical health and strain
 * - social: Social connections and isolation
 * - time: Time management and role conflict
 */

export const interventionsSeedData = [
  // EMOTIONAL ZONE INTERVENTIONS
  {
    title: "Mindfulness-Based Stress Reduction (MBSR)",
    description: "8-week program combining meditation, body awareness, and yoga to reduce caregiver stress and emotional burden.",
    category: "mindfulness",
    targetZones: ["emotional"],
    evidenceLevel: "high",
    duration: "15-30 min daily",
    tags: ["meditation", "stress reduction", "anxiety", "evidence-based"],
    content: `**What it is:**
A structured mindfulness program proven to reduce caregiver stress by 30-40% in clinical trials.

**How to start:**
1. Find a quiet space
2. Set aside 10-15 minutes daily
3. Focus on breath: inhale for 4 counts, hold 4, exhale 6
4. Notice thoughts without judgment
5. Use free apps: Insight Timer, UCLA Mindful

**Evidence:**
Meta-analysis of 23 studies shows MBSR reduces caregiver depression (d=0.58) and anxiety (d=0.50).

**Best for:**
Caregivers experiencing emotional exhaustion, worry, or feeling overwhelmed.`,
  },
  {
    title: "Gratitude Journaling",
    description: "Daily practice of writing three specific things you're grateful for to improve mood and reduce emotional burden.",
    category: "journaling",
    targetZones: ["emotional"],
    evidenceLevel: "moderate",
    duration: "5-10 min daily",
    tags: ["gratitude", "mood", "simple", "daily practice"],
    content: `**What it is:**
Write 3 specific gratitudes daily (not generic). Focus on why each matters.

**How to practice:**
1. Keep a dedicated notebook or phone notes
2. Best time: morning or before bed
3. Be specific: "Sarah smiled today" vs "I'm grateful for Sarah"
4. Include why it mattered to you
5. Re-read entries weekly

**Evidence:**
Studies show 6-week gratitude practice increases well-being by 25% and reduces caregiver burden perception.

**Best for:**
Caregivers feeling depleted, resentful, or losing perspective.`,
  },
  {
    title: "Cognitive Reframing Techniques",
    description: "Identify and challenge negative thought patterns that amplify caregiving stress.",
    category: "cognitive",
    targetZones: ["emotional"],
    evidenceLevel: "high",
    duration: "10-15 min as needed",
    tags: ["CBT", "thought patterns", "mental health", "coping"],
    content: `**What it is:**
CBT-based technique to shift from "I can't handle this" to realistic, balanced thinking.

**3-step process:**
1. **Catch the thought:** "I'm a terrible caregiver"
2. **Challenge evidence:** "Is this 100% true? What would I tell a friend?"
3. **Reframe balanced:** "I'm doing my best with limited resources"

**Common reframes:**
- "I should do everything" → "I can accept help"
- "It's all on me" → "I can set boundaries"
- "I'm failing" → "Caregiving is hard; I'm learning"

**Evidence:**
CBT-based interventions reduce caregiver depression by 40-50% (RCT meta-analysis, N=1,500).

**Best for:**
Caregivers with guilt, perfectionism, or catastrophic thinking.`,
  },
  {
    title: "Peer Support Groups",
    description: "Connect with other caregivers in facilitated groups (virtual or in-person) for validation and shared coping strategies.",
    category: "support",
    targetZones: ["emotional", "social"],
    evidenceLevel: "high",
    duration: "1-2 hours weekly",
    tags: ["community", "support group", "validation", "connection"],
    content: `**What it is:**
Facilitated groups where caregivers share experiences, reduce isolation, and learn from peers.

**Finding groups:**
- AARP: https://www.aarp.org/caregiving/
- Caregiver Action Network: 1-855-227-3640
- Local hospitals/senior centers
- Facebook groups (filter by topic: dementia, cancer, etc.)
- Virtual options: Zoom-based groups nationwide

**What to expect:**
- Confidential sharing (no advice-giving unless requested)
- Validation: "You're not alone"
- Practical tips from experienced caregivers
- Reduced isolation and emotional burden

**Evidence:**
Meta-analysis shows support groups reduce caregiver burden by 20-30% and depression by 35%.

**Best for:**
Caregivers feeling isolated, misunderstood, or needing validation.`,
  },

  // PHYSICAL ZONE INTERVENTIONS
  {
    title: "Restorative Yoga for Caregivers",
    description: "Gentle, prop-supported poses that relieve physical tension and improve flexibility without intense exertion.",
    category: "physical_activity",
    targetZones: ["physical", "emotional"],
    evidenceLevel: "moderate",
    duration: "20-30 min, 3x/week",
    tags: ["yoga", "flexibility", "gentle exercise", "pain relief"],
    content: `**What it is:**
Low-impact yoga focused on releasing tension, not building strength. Uses pillows, blankets, blocks.

**3 Essential Poses:**
1. **Supported Child's Pose** (5 min): Kneel, fold forward onto pillow stack
2. **Legs-Up-the-Wall** (10 min): Lie on back, legs resting on wall
3. **Reclined Twist** (3 min each side): Lie on back, knees to one side

**Modifications:**
- Chair yoga if mobility limited
- Use couch cushions instead of yoga blocks
- Focus on breath, not perfection

**Evidence:**
RCT shows restorative yoga reduces caregiver back pain (VAS -2.1) and improves sleep quality.

**Best for:**
Caregivers with physical strain, back pain, or muscle tension.`,
  },
  {
    title: "Progressive Muscle Relaxation (PMR)",
    description: "Systematic tensing and releasing muscle groups to reduce physical tension and improve body awareness.",
    category: "relaxation",
    targetZones: ["physical", "emotional"],
    evidenceLevel: "high",
    duration: "10-15 min daily",
    tags: ["tension relief", "body scan", "sleep aid", "stress"],
    content: `**What it is:**
Tense each muscle group for 5 seconds, then release for 10 seconds. Reduces physical stress response.

**Full-body sequence (10 min):**
1. Hands: Make fists → release
2. Arms: Flex biceps → release
3. Shoulders: Raise to ears → drop
4. Face: Scrunch → relax
5. Chest: Deep breath, hold → exhale
6. Stomach: Tighten abs → release
7. Legs: Point toes → release
8. Feet: Curl toes → release

**Tips:**
- Best before bed or after caregiving tasks
- Free audio guides: YouTube "PMR for caregivers"
- Combine with deep breathing

**Evidence:**
Cochrane review: PMR reduces physical tension and improves sleep in 65% of caregivers (N=800).

**Best for:**
Caregivers with muscle tension, jaw clenching, or sleep problems.`,
  },
  {
    title: "Micro-Exercise Breaks",
    description: "5-minute movement breaks integrated into caregiving routine to combat sedentary strain.",
    category: "physical_activity",
    targetZones: ["physical", "time"],
    evidenceLevel: "moderate",
    duration: "5 min, 4-6x/day",
    tags: ["quick", "movement", "energy", "practical"],
    content: `**What it is:**
Short movement bursts you can do while caregiving (no gym needed).

**6 Micro-Exercises:**
1. **Chair squats** (1 min): Stand up/sit down 10x
2. **Wall push-ups** (1 min): 15 reps
3. **Calf raises** (1 min): While washing dishes, brushing teeth
4. **Shoulder rolls** (30 sec): 10 forward, 10 back
5. **Marching in place** (1 min): Get heart rate up
6. **Stretching** (1.5 min): Neck, shoulders, hamstrings

**Integration tips:**
- During care recipient's nap
- While waiting for appointments
- Set phone reminders every 2 hours

**Evidence:**
Study shows 5-min movement breaks reduce caregiver fatigue by 28% and back pain by 35%.

**Best for:**
Time-constrained caregivers with physical fatigue or low energy.`,
  },
  {
    title: "Sleep Hygiene Protocol",
    description: "Evidence-based strategies to improve sleep quality despite caregiving disruptions.",
    category: "sleep",
    targetZones: ["physical", "emotional"],
    evidenceLevel: "high",
    duration: "Ongoing",
    tags: ["sleep", "rest", "recovery", "health"],
    content: `**What it is:**
Structured approach to improve sleep despite caregiving interruptions.

**Core practices:**
1. **Consistent schedule:** Bed/wake same time (±30 min)
2. **Wind-down routine:** 30 min before bed (no screens)
3. **Cool, dark room:** 65-68°F, blackout curtains
4. **No caffeine after 2pm**
5. **Write worries:** 5-min brain dump before bed
6. **White noise:** Mask care recipient sounds

**For interrupted sleep:**
- Power naps (20 min max) if needed
- Sleep when they sleep (if possible)
- Accept help for night shifts
- Consider respite care 1-2 nights/week

**Evidence:**
Sleep hygiene interventions improve caregiver sleep quality by 40% (Pittsburgh Sleep Quality Index).

**Best for:**
Caregivers with insomnia, frequent night waking, or chronic fatigue.`,
  },

  // SOCIAL ZONE INTERVENTIONS
  {
    title: "Scheduled Social Connections",
    description: "Maintain friendships through brief, regular check-ins rather than waiting for 'free time.'",
    category: "social",
    targetZones: ["social"],
    evidenceLevel: "moderate",
    duration: "15-30 min, 2-3x/week",
    tags: ["friendship", "connection", "isolation", "relationships"],
    content: `**What it is:**
Combat isolation with small, consistent social contacts vs. rare long visits.

**Practical strategies:**
1. **Micro-dates:** 20-min coffee with friend (virtual OK)
2. **Walking calls:** Combine exercise + social connection
3. **Parallel activities:** Watch same show, text reactions
4. **Scheduled texts:** Set recurring reminders to reach out
5. **Join online communities:** Hobby groups, book clubs

**Example schedule:**
- Monday: 15-min call with sister
- Wednesday: Virtual coffee with former coworker
- Saturday: Text check-in with 2-3 friends

**Evidence:**
Regular social contact (even brief) reduces caregiver loneliness by 45% and improves mental health.

**Best for:**
Caregivers feeling isolated, losing friendships, or disconnected from pre-caregiving life.`,
  },
  {
    title: "Boundary Setting Scripts",
    description: "Assertive communication templates to protect your time, energy, and relationships.",
    category: "communication",
    targetZones: ["social", "emotional", "time"],
    evidenceLevel: "moderate",
    duration: "As needed",
    tags: ["boundaries", "communication", "assertiveness", "relationships"],
    content: `**What it is:**
Pre-written scripts to say "no" or set limits without guilt.

**Common scenarios:**

**1. Unsolicited advice:**
"I appreciate you care, but I've got a plan with the doctor. What I need is [specific support]."

**2. Guilt trips:**
"I understand this is hard for you. I'm doing my best with the energy I have."

**3. Unrealistic expectations:**
"I can't commit to that right now. I can do [smaller alternative] instead."

**4. Boundary violation:**
"When you [action], I feel [emotion]. Going forward, I need [specific change]."

**5. Asking for help:**
"I need support with [specific task]. Could you [concrete ask] on [date/time]?"

**Practice tips:**
- Rehearse out loud before difficult conversations
- Use "I" statements
- Don't over-explain or apologize
- Offer alternatives when possible

**Best for:**
Caregivers dealing with family conflict, enabling behavior, or feeling taken advantage of.`,
  },
  {
    title: "Respite Care Utilization",
    description: "Systematic use of temporary relief care (adult day programs, in-home aides, facility stays) to prevent burnout.",
    category: "respite",
    targetZones: ["social", "emotional", "physical", "time"],
    evidenceLevel: "high",
    duration: "4-8 hours weekly minimum",
    tags: ["respite", "break", "self-care", "essential"],
    content: `**What it is:**
Scheduled breaks where someone else provides care. Not optional—medically necessary for caregiver health.

**Types of respite:**
1. **Adult day programs:** 4-8 hours, social activities for care recipient
2. **In-home aides:** Come to your home, 2-8 hour shifts
3. **Overnight/weekend stays:** Facility-based, 1-3 days
4. **Volunteer programs:** Free or low-cost (faith communities, nonprofits)
5. **Family rotation:** Scheduled help from relatives

**Finding resources:**
- ARCH National Respite Network: 919-490-5577
- Local Area Agency on Aging: eldercare.acl.gov
- Medicaid waiver programs (income-based)
- VA Caregiver Support (veterans' families)

**Overcoming guilt:**
Respite isn't selfish—it prevents caregiver hospitalization and improves care quality.

**Evidence:**
Meta-analysis: Regular respite reduces caregiver burden by 40% and delays care recipient institutionalization.

**Best for:**
All caregivers, especially those providing 24/7 care or showing burnout signs.`,
  },

  // TIME ZONE INTERVENTIONS
  {
    title: "Time Blocking for Caregivers",
    description: "Allocate specific time blocks for caregiving, self-care, and rest to prevent constant availability.",
    category: "time_management",
    targetZones: ["time", "emotional"],
    evidenceLevel: "moderate",
    duration: "15 min weekly planning",
    tags: ["planning", "schedule", "productivity", "balance"],
    content: `**What it is:**
Visual schedule dividing day into care tasks, personal time, and buffer zones.

**Weekly planning template:**
1. **Fixed blocks:** Medications, meals, appointments
2. **Flex blocks:** Household tasks, care recipient activities
3. **Sacred blocks:** Your non-negotiable time (exercise, friends, hobbies)
4. **Buffer:** 15-20% unscheduled for emergencies

**Example day:**
- 7-9am: Morning care routine
- 9-10am: YOUR exercise/coffee
- 10-12pm: Flexible (errands, housework)
- 12-1pm: Lunch + care
- 1-3pm: Care recipient nap = YOUR time (protect this)
- 3-5pm: Afternoon care/activities
- 5-7pm: Dinner + care
- 7-9pm: YOUR wind-down

**Tools:**
- Google Calendar (color-code blocks)
- Paper planner with stickers
- Shared family calendar (delegate tasks)

**Best for:**
Caregivers feeling constantly reactive, overwhelmed, or with no personal time.`,
  },
  {
    title: "Task Delegation Matrix",
    description: "Systematic approach to identify which caregiving tasks can be delegated, automated, or eliminated.",
    category: "delegation",
    targetZones: ["time", "social"],
    evidenceLevel: "moderate",
    duration: "30 min one-time, review monthly",
    tags: ["delegation", "efficiency", "help", "teamwork"],
    content: `**What it is:**
Categorize every task to reduce your workload without compromising care.

**4-quadrant analysis:**

**1. Delegate (give to others):**
- Grocery shopping → Family, Instacart
- Lawn care → Neighbor, service
- Transportation → Volunteers, Uber
- Paperwork → Social worker, family

**2. Automate (set up once):**
- Medication delivery → Auto-refill
- Bill payments → Auto-pay
- Meal prep → Subscription boxes
- Appointment reminders → Calendar alerts

**3. Simplify (reduce scope):**
- Cooking → Batch cook, slow cooker, pre-cut veggies
- Cleaning → Lower standards, spot-clean only
- Errands → Combine trips, order online

**4. Eliminate (not essential):**
- Perfect home → "Good enough" is fine
- Complex meals → Simple nutrition works
- Frequent visits from extended family → Set boundaries

**Action steps:**
1. List all caregiving + household tasks
2. Sort into quadrants
3. Identify 3 tasks to delegate this month
4. Create specific asks for helpers

**Best for:**
Caregivers doing everything alone, overwhelmed by tasks, or refusing help.`,
  },
  {
    title: "Energy Management (Spoon Theory)",
    description: "Track and allocate limited energy using 'spoons' as units to prevent overcommitment and crashes.",
    category: "energy",
    targetZones: ["time", "physical", "emotional"],
    evidenceLevel: "low",
    duration: "Daily awareness practice",
    tags: ["energy", "pacing", "chronic stress", "self-awareness"],
    content: `**What it is:**
Metaphor where you start each day with limited 'spoons' (energy units). Each task costs spoons.

**How it works:**
1. **Morning:** Assess energy (e.g., 12 spoons today)
2. **Plan:** Allocate spoons to tasks:
   - Morning care routine: 3 spoons
   - Doctor appointment: 4 spoons
   - Grocery shopping: 2 spoons
   - Cooking dinner: 2 spoons
   - Social call: 1 spoon
3. **Total:** 12 spoons = Perfectly matched
4. **Buffer:** Save 2 spoons for unexpected needs

**Warning signs:**
- Consistently out of spoons by noon → Reduce commitments
- Borrowing tomorrow's spoons → Leading to crashes

**Adjustments:**
- Low-spoon days: Survival mode (essentials only)
- High-spoon days: Tackle harder tasks + rest
- Delegate high-spoon tasks when possible

**Communication:**
"I only have 2 spoons left today, so I can't [task]. Can we do it tomorrow?"

**Best for:**
Caregivers with chronic fatigue, illness, or unpredictable energy levels.`,
  },

  // MULTI-ZONE INTERVENTIONS
  {
    title: "Behavioral Activation Plan",
    description: "Schedule small, pleasurable activities weekly to combat depression and maintain identity beyond caregiving.",
    category: "behavioral",
    targetZones: ["emotional", "social", "time"],
    evidenceLevel: "high",
    duration: "2-3 activities weekly",
    tags: ["depression", "joy", "identity", "activation"],
    content: `**What it is:**
Evidence-based depression treatment: scheduling positive activities, even when you don't feel like it.

**How to create your plan:**
1. **List 10 pre-caregiving joys:**
   - Reading, gardening, art, music, sports, cooking, etc.

2. **Adapt to constraints:**
   - "Can't go to concerts" → Listen to live albums with headphones
   - "Can't garden outside" → Grow herbs on windowsill
   - "Can't meet friends for dinner" → Virtual game night

3. **Schedule 3/week minimum:**
   - Monday: 30-min audio book during care recipient nap
   - Wednesday: 20-min drawing while they watch TV
   - Saturday: Virtual coffee with friend

4. **Track mood before/after:**
   - Notice: "I feel slightly better after, even if I didn't want to start"

**Key principle:**
Action comes before motivation. Do it anyway, even when depressed.

**Evidence:**
Behavioral activation equally effective as antidepressants for mild-moderate depression (RCT, JAMA).

**Best for:**
Caregivers with depression, anhedonia, or loss of identity.`,
  },
  {
    title: "Professional Counseling (Caregiver-Specific)",
    description: "Work with therapist trained in caregiver stress, anticipatory grief, and role transition.",
    category: "therapy",
    targetZones: ["emotional", "social"],
    evidenceLevel: "high",
    duration: "45-60 min weekly",
    tags: ["therapy", "counseling", "mental health", "professional"],
    content: `**What it is:**
Structured therapy addressing caregiver-specific issues (guilt, grief, role strain, family conflict).

**Finding therapists:**
- Psychology Today: Filter by "caregiver stress"
- AARP: https://www.aarp.org/caregiving/
- Insurance provider directory
- Telehealth: BetterHelp, Talkspace (convenience)
- Sliding scale: OpenPath Collective

**What to look for:**
- Experience with caregiver burnout
- Training in CBT or ACT
- Understanding of anticipatory grief
- Family systems experience
- Culturally competent

**Topics to address:**
- Guilt and resentment
- Anticipatory grief (pre-loss mourning)
- Identity beyond caregiver role
- Family dynamics and boundaries
- Decision-making stress (placement, end-of-life)

**Evidence:**
Psychotherapy reduces caregiver depression by 50% and burden by 30% (meta-analysis, N=2,000).

**Cost:**
- Insurance: $0-50 copay
- Out-of-pocket: $75-200/session
- Sliding scale: $30-75

**Best for:**
Caregivers with depression, complicated family dynamics, or major life decisions.`,
  },
];
