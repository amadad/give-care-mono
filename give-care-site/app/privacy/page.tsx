export const metadata = {
  title: 'Privacy Policy - GiveCare',
  description: 'Comprehensive Privacy Policy for GiveCare AI-powered caregiving support platform.'
};

export default function PrivacyPage() {
  return (
    <>
      <section className="section-standard">
        <div className="container-editorial-narrow">
          <h1 className="heading-hero mb-6">Privacy Policy</h1>
          <p className="text-base-content/60 mb-8">Last Updated: October 26, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Introduction & Scope */}
            <section>
              <h2 className="heading-section">1. Introduction & Scope</h2>
              <p>
                Welcome to GiveCare™ ("we," "our," or "us"). We are committed to protecting your privacy and being transparent about how we collect, use, and share your information. This Privacy Policy explains our data practices for the GiveCare AI-powered SMS/RCS caregiving support platform (the "Service").
              </p>
              <p>
                GiveCare provides personalized caregiving support through text messaging, clinical assessments, wellness tracking, and AI-powered conversations. We are based in New York and this policy is governed by New York law.
              </p>
              <p className="font-semibold">
                By using GiveCare, you consent to the data practices described in this policy. If you do not agree, please do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="heading-section">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account Information:</strong> Full name, email address, phone number when you sign up for GiveCare
                </li>
                <li>
                  <strong>SMS Conversations:</strong> All text messages you send to and receive from our AI agents, including questions, responses, and ongoing conversations
                </li>
                <li>
                  <strong>Assessment Responses:</strong> Your answers to validated clinical assessments including:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Burden Scale for Family Caregivers (BSFC)</li>
                    <li>Ecological Momentary Assessment (EMA)</li>
                    <li>Caregiver Well-Being Scale (CWBS)</li>
                    <li>REACH-II caregiver assessments</li>
                    <li>Social Determinants of Health (SDOH) screenings</li>
                  </ul>
                </li>
                <li>
                  <strong>Wellness Data:</strong> Daily check-in responses, capacity scores, burnout levels, pressure zone classifications (1-5), and wellness tracking information
                </li>
                <li>
                  <strong>Payment Information:</strong> Billing details processed through Stripe for your $9.99/month or $99/year subscription (we do not store credit card numbers directly)
                </li>
                <li>
                  <strong>Communication Preferences:</strong> Newsletter subscriptions, notification settings, and communication preferences
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Usage Data:</strong> Login times, feature usage patterns, which AI agents you interact with (Main, Crisis, or Assessment), intervention recommendations accessed, and session durations
                </li>
                <li>
                  <strong>Device Information:</strong> Device type, operating system, browser type, IP address, mobile network information
                </li>
                <li>
                  <strong>Cookies & Tracking:</strong> Session cookies, analytics cookies (if you opt in to Google Analytics or Hotjar), and performance monitoring data
                </li>
                <li>
                  <strong>SMS Metadata:</strong> Message timestamps, delivery status, phone number format (via Twilio)
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">2.3 Information From Third Parties</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Local Resource Data:</strong> Information about caregiving resources near you retrieved through the Brave Search API based on your location or zip code
                </li>
                <li>
                  <strong>Payment Processing:</strong> Transaction status and billing information from Stripe
                </li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="heading-section">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>

              <h3 className="text-xl font-semibold mt-6 mb-4">3.1 Provide Core Services</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Deliver AI-powered conversational support through our three specialized agents (Main, Crisis, and Assessment)</li>
                <li>Administer and score clinical assessments to measure caregiver burden and wellbeing</li>
                <li>Calculate your burnout composite score (0-100) and classify you into pressure zones (1-5)</li>
                <li>Match you with relevant evidence-based interventions from our library of 20+ strategies</li>
                <li>Detect crisis situations and provide immediate resources (988 Suicide & Crisis Lifeline, Crisis Text Line 741741, or 911)</li>
                <li>Send proactive wellness check-ins and scheduled reminders</li>
                <li>Find local caregiving resources relevant to your needs and location</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">3.2 Improve & Personalize</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personalize your experience based on assessment results and conversation history</li>
                <li>Train and improve our AI models to provide better support (your data may be used in aggregated, de-identified form)</li>
                <li>Analyze usage patterns to enhance features and develop new interventions</li>
                <li>Conduct research on caregiver wellness and intervention effectiveness</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">3.3 Business Operations</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process subscription payments and manage billing</li>
                <li>Send service updates, newsletters, and educational content about caregiving</li>
                <li>Provide customer support and respond to your inquiries</li>
                <li>Ensure security, prevent fraud, and enforce our Terms of Service</li>
                <li>Comply with legal obligations and respond to lawful requests</li>
              </ul>
            </section>

            {/* How We Share Your Information */}
            <section>
              <h2 className="heading-section">4. How We Share Your Information</h2>
              <p className="font-semibold mb-4">We do not sell your personal information to anyone.</p>
              <p className="mb-4">We share your information with the following third-party service providers who help us operate GiveCare:</p>

              <h3 className="text-xl font-semibold mt-6 mb-4">4.1 Essential Service Providers</h3>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Convex (Backend Platform):</strong> Hosts our database and serverless functions. All your account data, conversations, assessments, and wellness tracking are stored on Convex servers.
                </li>
                <li>
                  <strong>OpenAI (AI Processing):</strong> Powers our AI agents using the OpenAI Agents SDK and GPT models. Your SMS conversations and assessment data are sent to OpenAI for processing.
                  <span className="block mt-2 font-semibold">Important: OpenAI retains your conversation data for 30 days in their session storage, after which it is automatically deleted. See Section 5.2 for details.</span>
                </li>
                <li>
                  <strong>Twilio (SMS Delivery):</strong> Delivers text messages between you and GiveCare. Twilio processes your phone number and message content to route communications.
                </li>
                <li>
                  <strong>Stripe (Payment Processing):</strong> Handles all subscription billing and payment processing. Stripe receives your payment information directly (we never see or store your full credit card numbers).
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">4.2 Optional Service Providers</h3>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong>Resend (Email Service):</strong> Sends newsletter and transactional emails if you subscribe to our communications.
                </li>
                <li>
                  <strong>Google Analytics (Analytics):</strong> Tracks website usage and user behavior, only if you consent to analytics cookies.
                </li>
                <li>
                  <strong>Hotjar (User Research):</strong> Records anonymized user sessions and heatmaps, only if you opt in.
                </li>
                <li>
                  <strong>Brave Search API (Resource Discovery):</strong> Searches for local caregiving resources when you request them. Only your location/zip code is shared, not your personal information.
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">4.3 Legal & Safety Disclosures</h3>
              <p>We may disclose your information when required by law or to protect safety:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To comply with legal obligations, court orders, or government requests</li>
                <li>To enforce our Terms of Service or investigate violations</li>
                <li>To protect the rights, property, or safety of GiveCare, our users, or the public</li>
                <li>In connection with a business transaction (merger, acquisition, or sale of assets)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">4.4 With Your Consent</h3>
              <p>We may share your information with other parties when you explicitly direct us to do so.</p>
            </section>

            {/* Data Retention & Storage */}
            <section>
              <h2 className="heading-section">5. Data Retention & Storage</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">5.1 How Long We Keep Your Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account Information:</strong> Retained as long as your account is active, plus 90 days after account deletion (for recovery and legal compliance)
                </li>
                <li>
                  <strong>SMS Conversations:</strong> Stored in our Convex database indefinitely while your account is active, to maintain conversation context and history
                </li>
                <li>
                  <strong>OpenAI Session Data:</strong> Automatically deleted after 30 days by OpenAI (we cannot extend this retention period)
                </li>
                <li>
                  <strong>Assessment Results:</strong> Retained indefinitely while your account is active to track progress over time
                </li>
                <li>
                  <strong>Wellness Tracking Data:</strong> Kept for the duration of your account plus 90 days
                </li>
                <li>
                  <strong>Payment Records:</strong> Retained for 7 years as required by financial regulations
                </li>
                <li>
                  <strong>Anonymized Analytics:</strong> May be retained indefinitely for research and service improvement
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">5.2 OpenAI Data Processing</h3>
              <p className="font-semibold mb-2">Important information about how OpenAI handles your data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your SMS conversations are sent to OpenAI servers for AI processing</li>
                <li>OpenAI stores conversation data in "sessions" that are automatically deleted after 30 days</li>
                <li>OpenAI may process data on servers located outside the United States (see Section 11 on International Transfers)</li>
                <li>OpenAI's own privacy policy applies to their data handling: <a href="https://openai.com/privacy" className="link">https://openai.com/privacy</a></li>
                <li>We have contractual agreements with OpenAI requiring them to protect your data, but they operate as an independent data processor</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">5.3 Where Data Is Stored</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Primary database: Convex cloud infrastructure (United States)</li>
                <li>AI processing: OpenAI servers (may include international locations)</li>
                <li>SMS routing: Twilio infrastructure (United States)</li>
                <li>Payment data: Stripe servers (United States and Europe)</li>
              </ul>
            </section>

            {/* AI & Automated Processing */}
            <section>
              <h2 className="heading-section">6. AI & Automated Processing</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">6.1 How We Use AI</h3>
              <p>GiveCare uses artificial intelligence extensively to provide caregiving support:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Three Specialized AI Agents:</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li><strong>Main Agent:</strong> Handles general caregiving questions, wellness check-ins, and intervention recommendations</li>
                    <li><strong>Crisis Agent:</strong> Detects crisis situations and provides immediate mental health resources</li>
                    <li><strong>Assessment Agent:</strong> Guides you through clinical assessments and explains results</li>
                  </ul>
                </li>
                <li>
                  <strong>Automated Scoring:</strong> Assessment responses are automatically scored using validated clinical algorithms to calculate burden levels and wellness metrics
                </li>
                <li>
                  <strong>Burnout Calculator:</strong> Combines multiple data points to generate a composite burnout score (0-100) and classify you into one of five pressure zones
                </li>
                <li>
                  <strong>Intervention Matching:</strong> AI analyzes your assessment results and conversation history to recommend relevant evidence-based interventions
                </li>
                <li>
                  <strong>Crisis Detection:</strong> Automated analysis of your messages to identify language indicating potential crisis or self-harm risk
                </li>
                <li>
                  <strong>Proactive Check-ins:</strong> Scheduled wellness messages triggered by time-based rules and your usage patterns
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">6.2 AI Limitations & Safeguards</h3>
              <p className="font-semibold mb-2">Important disclaimers about AI-powered features:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Not Perfect:</strong> AI can make mistakes, misunderstand context, or provide inaccurate information
                </li>
                <li>
                  <strong>Not Medical Advice:</strong> GiveCare does not provide medical diagnosis, treatment recommendations, or professional healthcare services
                </li>
                <li>
                  <strong>Not Emergency Services:</strong> GiveCare is not a substitute for 911, crisis hotlines, or emergency medical care
                </li>
                <li>
                  <strong>Human Oversight Recommended:</strong> Always consult healthcare professionals for medical decisions and serious caregiving concerns
                </li>
                <li>
                  <strong>Automated Decisions:</strong> Some features (like pressure zone classification) are fully automated. You can request human review by contacting support@givecareapp.com
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">6.3 Your Control Over AI</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can opt out of automated wellness check-ins at any time via text message</li>
                <li>You can request deletion of specific conversations or assessment results</li>
                <li>You can pause or delete your account, which stops all AI processing of your data</li>
              </ul>
            </section>

            {/* Your Privacy Rights */}
            <section>
              <h2 className="heading-section">7. Your Privacy Rights</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">7.1 Rights for All Users</h3>
              <p>Regardless of where you live, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Access:</strong> Request a copy of all personal information we have about you
                </li>
                <li>
                  <strong>Correction:</strong> Update or correct inaccurate information in your account
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements)
                </li>
                <li>
                  <strong>Data Portability:</strong> Receive your data in a structured, machine-readable format (JSON or CSV)
                </li>
                <li>
                  <strong>Opt-Out of Communications:</strong> Unsubscribe from newsletters and marketing emails
                </li>
                <li>
                  <strong>SMS Consent Withdrawal:</strong> Text "STOP" at any time to stop receiving messages and cancel your subscription
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">7.2 California Privacy Rights (CCPA/CPRA)</h3>
              <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Know:</strong> Request detailed information about the categories and specific pieces of personal information we collect, use, and share
                </li>
                <li>
                  <strong>Delete:</strong> Request deletion of your personal information (with certain exceptions)
                </li>
                <li>
                  <strong>Opt-Out of Sale:</strong> We do not sell personal information, so there is nothing to opt out of
                </li>
                <li>
                  <strong>Opt-Out of Sharing for Targeted Advertising:</strong> We do not share your information for targeted advertising
                </li>
                <li>
                  <strong>Limit Sensitive Personal Information Use:</strong> You can request we limit use of sensitive data beyond what's necessary to provide services
                </li>
                <li>
                  <strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights
                </li>
              </ul>
              <p className="mt-4">
                <strong>Personal Information Categories Collected (Last 12 Months):</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Identifiers (name, email, phone number, IP address)</li>
                <li>Commercial information (subscription records, payment history)</li>
                <li>Internet activity (usage data, device information)</li>
                <li>Sensitive personal information (health data, assessment responses, SMS conversations)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">7.3 How to Exercise Your Rights</h3>
              <p>To exercise any privacy rights, contact us at:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: <a href="mailto:privacy@givecareapp.com" className="link">privacy@givecareapp.com</a></li>
                <li>Subject line: "Privacy Rights Request"</li>
                <li>Include: Your full name, phone number, and specific request</li>
              </ul>
              <p className="mt-4">
                We will respond within 30 days (or 45 days for complex requests). We may ask you to verify your identity before processing requests.
              </p>
            </section>

            {/* Security Measures */}
            <section>
              <h2 className="heading-section">8. Security Measures</h2>
              <p>We implement industry-standard security measures to protect your information:</p>

              <h3 className="text-xl font-semibold mt-6 mb-4">8.1 Technical Safeguards</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Encryption in Transit:</strong> All data transmitted between your device and our servers uses TLS/SSL encryption (HTTPS)
                </li>
                <li>
                  <strong>Encryption at Rest:</strong> Sensitive data is encrypted in our databases
                </li>
                <li>
                  <strong>Access Controls:</strong> Role-based access limits who can view your information internally
                </li>
                <li>
                  <strong>Authentication:</strong> Secure login systems with phone number verification
                </li>
                <li>
                  <strong>Infrastructure Security:</strong> Our cloud providers (Convex, OpenAI, Twilio, Stripe) maintain SOC 2 compliance and industry certifications
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">8.2 Operational Safeguards</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection and privacy</li>
                <li>Incident response procedures for potential data breaches</li>
                <li>Contractual protections with all third-party service providers</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">8.3 Limitations</h3>
              <p>
                No security system is 100% secure. While we use reasonable measures to protect your data, we cannot guarantee absolute security. In the event of a data breach affecting your personal information, we will notify you as required by law.
              </p>
            </section>

            {/* Cookies & Tracking */}
            <section>
              <h2 className="heading-section">9. Cookies & Tracking Technologies</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">9.1 What We Use</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Essential Cookies:</strong> Required for login, session management, and core Service functionality (cannot be disabled)
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Google Analytics and Hotjar for understanding user behavior (optional, requires your consent)
                </li>
                <li>
                  <strong>Performance Cookies:</strong> Monitor Service performance and identify technical issues
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">9.2 Your Cookie Choices</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>You can manage cookie preferences through our cookie consent banner (first-time visitors)</li>
                <li>You can disable cookies in your browser settings (may affect Service functionality)</li>
                <li>You can opt out of Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" className="link">https://tools.google.com/dlpage/gaoptout</a></li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">9.3 Do Not Track</h3>
              <p>
                Some browsers have "Do Not Track" features. We currently do not respond to Do Not Track signals, but we limit tracking to essential functionality and analytics you consent to.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="heading-section">10. Children's Privacy</h2>
              <p className="font-semibold mb-4">
                GiveCare is not intended for children under 13 years old.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We do not knowingly collect personal information from children under 13 (COPPA compliance)</li>
                <li>If you are under 18, you must have parental permission to use GiveCare</li>
                <li>If we discover we have inadvertently collected data from a child under 13, we will delete it immediately</li>
                <li>Parents: If you believe your child has provided us information without your consent, contact us at privacy@givecareapp.com</li>
              </ul>
            </section>

            {/* International Users */}
            <section>
              <h2 className="heading-section">11. International Users & Data Transfers</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">11.1 U.S.-Based Service</h3>
              <p>
                GiveCare is based in the United States and primarily serves U.S. users. Our servers and service providers are predominantly located in the United States.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-4">11.2 International Data Transfers</h3>
              <p>
                If you access GiveCare from outside the United States, your information will be transferred to, stored, and processed in the United States and potentially other countries where our service providers operate (particularly OpenAI servers).
              </p>
              <p className="mt-4">
                The United States and other countries may have different data protection laws than your home country. By using GiveCare, you consent to the transfer of your information to these countries.
              </p>

              <h3 className="text-xl font-semibold mt-6 mb-4">11.3 European Economic Area (EEA) Users</h3>
              <p>
                If you are in the EEA, you may have additional rights under GDPR. We rely on the following legal bases for processing your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Contract:</strong> Processing necessary to provide the Service you subscribed to</li>
                <li><strong>Consent:</strong> Where you have explicitly agreed (e.g., newsletter subscriptions, analytics)</li>
                <li><strong>Legitimate Interests:</strong> For service improvement, security, and fraud prevention</li>
              </ul>
              <p className="mt-4">
                EEA users have rights to data portability, restriction of processing, and the right to lodge complaints with supervisory authorities.
              </p>
            </section>

            {/* Medical Disclaimer */}
            <section>
              <h2 className="heading-section">12. Important Medical & Healthcare Disclaimers</h2>

              <h3 className="text-xl font-semibold mt-6 mb-4">12.1 Not a Healthcare Provider</h3>
              <p className="font-semibold mb-4">
                GiveCare is NOT a healthcare provider and is NOT covered by HIPAA (Health Insurance Portability and Accountability Act).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are a technology platform providing caregiving support and wellness tracking</li>
                <li>We do not provide medical diagnosis, treatment, or professional healthcare services</li>
                <li>Our AI agents are not licensed healthcare professionals</li>
                <li>While we handle health-related information, we are not subject to HIPAA regulations as a "covered entity" or "business associate"</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">12.2 Not Medical Advice</h3>
              <p className="font-semibold mb-2">
                GiveCare does not provide medical advice. All information and recommendations are for educational and supportive purposes only.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Always consult qualified healthcare professionals for medical decisions</li>
                <li>Do not disregard professional medical advice or delay seeking it because of GiveCare</li>
                <li>Our assessments are screening tools, not diagnostic instruments</li>
                <li>Intervention recommendations are general wellness strategies, not personalized treatment plans</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">12.3 Not Emergency Services</h3>
              <p className="font-semibold mb-2">
                GiveCare is NOT a substitute for emergency services.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If you are experiencing a medical emergency, call 911 immediately</li>
                <li>If you are having thoughts of self-harm or suicide, contact:
                  <ul className="list-disc pl-6 mt-2">
                    <li>988 Suicide & Crisis Lifeline (call or text 988)</li>
                    <li>Crisis Text Line (text "HELLO" to 741741)</li>
                    <li>911 for immediate danger</li>
                  </ul>
                </li>
                <li>Our Crisis Agent provides resource referrals but is not a crisis intervention service</li>
                <li>We cannot dispatch emergency services or provide real-time crisis counseling</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-4">12.4 Your Responsibility</h3>
              <p>
                By using GiveCare, you acknowledge that you are responsible for your own healthcare decisions and will seek appropriate professional help when needed. GiveCare is a support tool to complement—not replace—professional medical care, therapy, or emergency services.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="heading-section">13. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other reasons.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>We will post the updated policy on this page with a new "Last Updated" date</li>
                <li>For material changes, we will notify you via email or SMS at least 30 days before changes take effect</li>
                <li>Your continued use of GiveCare after changes become effective constitutes acceptance of the updated policy</li>
                <li>If you do not agree with changes, you may cancel your subscription and delete your account</li>
              </ul>
              <p className="mt-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="heading-section">14. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-base-200 p-6 rounded-lg">
                <p className="font-semibold mb-2">GiveCare Privacy Team</p>
                <p>Email: <a href="mailto:privacy@givecareapp.com" className="link">privacy@givecareapp.com</a></p>
                <p className="mt-4">For general support inquiries:</p>
                <p>Email: <a href="mailto:support@givecareapp.com" className="link">support@givecareapp.com</a></p>
                <p className="mt-4 text-sm text-base-content/60">
                  We aim to respond to all privacy inquiries within 30 days.
                </p>
              </div>
            </section>

            {/* Final Notice */}
            <section className="mt-12 p-6 bg-amber-50 border-l-4 border-amber-500 rounded">
              <p className="font-semibold mb-2">Your Consent</p>
              <p>
                By signing up for GiveCare and using our Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, please do not use GiveCare.
              </p>
              <p className="mt-4">
                <strong>SMS Consent:</strong> By providing your phone number, you consent to receive text messages from GiveCare as part of our Service. Standard message and data rates may apply. You can opt out at any time by texting "STOP."
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
