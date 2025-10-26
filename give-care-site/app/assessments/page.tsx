
const assessments = [
  {
    name: "Daily Check-In (EMA)",
    questions: 3,
    duration: "30 seconds",
    frequency: "Daily",
    validated: "Clinical trial",
    description: "Quick pulse check on mood, burden, and stress",
    exampleQuestions: [
      "How are you feeling right now?",
      "How overwhelming does caregiving feel today?",
      "How stressed do you feel right now?"
    ],
    subscales: ["mood", "burden", "stress"]
  },
  {
    name: "Weekly Well-Being (CWBS)",
    questions: 12,
    duration: "3 minutes",
    frequency: "Weekly",
    validated: "Tebb et al. (1999, 2012)",
    description: "Comprehensive look at activities and needs",
    exampleQuestions: [
      "How often do you help with meals and hygiene?",
      "How often do you need a break from caregiving?",
      "How often do you need help coordinating care?"
    ],
    subscales: ["activities (8 items)", "needs (4 items)"]
  },
  {
    name: "Stress & Coping (REACH-II)",
    questions: 10,
    duration: "3 minutes",
    frequency: "Biweekly",
    validated: "Belle et al. (2006) NIH-funded RCT",
    description: "Emotional state, self-care, and support network",
    exampleQuestions: [
      "How often have you felt overwhelmed?",
      "Do you have enough time for yourself?",
      "How often do you feel isolated or alone?"
    ],
    subscales: ["stress", "self_care", "social", "efficacy", "emotional", "physical", "support"]
  },
  {
    name: "Needs Screening (SDOH)",
    questions: 28,
    duration: "5 minutes",
    frequency: "Monthly",
    validated: "Public health standard",
    description: "Social determinants: financial, housing, food, healthcare, transportation",
    exampleQuestions: [
      "Do you worry about paying bills?",
      "Is your housing safe and adequate?",
      "Do you have reliable transportation?"
    ],
    subscales: ["financial (5)", "housing (3)", "transportation (3)", "social (5)", "healthcare (4)", "food (3)", "legal (3)", "technology (2)"]
  }
];

export default function AssessmentsPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-standard bg-base-100">
          <div className="container-editorial text-center">
            <h1 className="heading-hero mb-6">
              4 Validated Clinical Assessments
            </h1>
            <p className="body-large max-w-2xl mx-auto">
              Track your burnout with clinical-grade tools validated in peer-reviewed research.
              From quick 30-second pulse checks to comprehensive 5-minute needs screenings.
            </p>
          </div>
        </section>

        {/* Assessments Grid */}
        <section className="section-standard bg-white">
          <div className="container-editorial">
            <div className="grid gap-12 md:gap-16">
              {assessments.map((assessment, index) => (
                <div key={index} className="border-l-4 border-amber-500 pl-6 md:pl-8">
                  {/* Header */}
                  <div className="flex flex-wrap items-baseline gap-2 mb-4">
                    <h2 className="text-2xl md:text-3xl font-light text-amber-950">
                      {assessment.name}
                    </h2>
                    <span className="text-sm text-amber-950 bg-amber-100 px-3 py-1 rounded-full">
                      {assessment.frequency}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-6 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium text-gray-900">{assessment.questions}</span> questions
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{assessment.duration}</span> to complete
                    </div>
                    <div>
                      Validated: <span className="font-medium text-gray-900">{assessment.validated}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-base text-gray-700 mb-6">
                    {assessment.description}
                  </p>

                  {/* Example Questions */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Example Questions
                    </h3>
                    <ul className="space-y-2">
                      {assessment.exampleQuestions.map((question, qIndex) => (
                        <li key={qIndex} className="flex items-start gap-3 text-sm text-gray-600">
                          <span className="text-amber-500 mt-1">•</span>
                          <span>"{question}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Subscales */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-2">
                      Measures
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {assessment.subscales.map((subscale, sIndex) => (
                        <span
                          key={sIndex}
                          className="text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-full"
                        >
                          {subscale}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Burnout Score Explainer */}
        <section className="section-standard bg-amber-950 text-amber-50">
          <div className="container-editorial">
            <div className="max-w-3xl mx-auto">
              <h2 className="heading-section-dark mb-8">
                Your Burnout Score (0-100)
              </h2>

              <div className="space-y-6 text-amber-100">
                <p className="text-lg leading-relaxed">
                  All 4 assessments combine to create your composite burnout score.
                  <strong className="text-amber-50"> Higher = healthier</strong> (inverse of distress).
                </p>

                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right font-medium text-amber-50">0-19</div>
                    <div className="flex-1 h-2 bg-red-600 rounded-full"></div>
                    <div className="w-32 text-amber-50">Crisis</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right font-medium text-amber-50">20-39</div>
                    <div className="flex-1 h-2 bg-orange-500 rounded-full"></div>
                    <div className="w-32 text-amber-50">High Stress</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right font-medium text-amber-50">40-59</div>
                    <div className="flex-1 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-32 text-amber-50">Moderate</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right font-medium text-amber-50">60-79</div>
                    <div className="flex-1 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-32 text-amber-50">Mild</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right font-medium text-amber-50">80-100</div>
                    <div className="flex-1 h-2 bg-emerald-600 rounded-full"></div>
                    <div className="w-32 text-amber-50">Thriving</div>
                  </div>
                </div>

                <p className="text-base leading-relaxed mt-8">
                  <strong className="text-amber-50">Updated after each assessment.</strong> Recent scores weighted higher.
                  Confidence score (0-1) shows data quality based on completeness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-standard bg-white">
          <div className="container-editorial text-center">
            <h2 className="heading-section mb-6">
              Ready to see your score?
            </h2>
            <p className="body-large max-w-xl mx-auto mb-8">
              Start with a quick 3-question check-in (30 seconds).
              No account required.
            </p>
            <a
              href="/assessment"
              className="btn-editorial-primary"
            >
              Start Free Assessment
            </a>
          </div>
        </section>
    </>
  );
}
