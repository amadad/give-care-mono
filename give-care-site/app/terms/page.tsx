export const metadata = {
  title: 'Terms of Service - GiveCare',
  description: 'Terms of Service for GiveCare AI-powered caregiving support platform.'
};

export default function TermsPage() {
  return (
    <>
      <section className="section-standard">
        <div className="container-editorial-narrow">
          <h1 className="heading-hero mb-6">Terms of Service</h1>
          <p className="text-base-content/60 mb-8">Last Updated: January 26, 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="heading-section">1. Acceptance of Terms</h2>
              <p>
                Welcome to GiveCare™ ("GiveCare," "we," "us," or "our"). By accessing or using our SMS-based AI caregiving support platform (the "Service"), you agree to be bound by these Terms of Service ("Terms").
              </p>
              <p>
                <strong>Please read these Terms carefully before using the Service.</strong> If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p>
                By subscribing to GiveCare, texting us, or otherwise using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="heading-section">2. Description of Service</h2>
              <p>
                GiveCare provides SMS and RCS-based support for family caregivers through AI-powered technology. Our Service includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Three specialized AI agents (Main Support Agent, Crisis Support Agent, Assessment Agent) that provide personalized caregiving support via text message</li>
                <li>Clinical assessment tools including the Brief Stress and Fatigue Checklist (BSFC), Ecological Momentary Assessments (EMA), Caregiver Well-Being Scale (CWBS), REACH-II assessment, and Social Determinants of Health (SDOH) screening</li>
                <li>Personalized interventions and wellness tracking based on your responses</li>
                <li>Crisis detection and connections to third-party mental health resources</li>
                <li>Automated text message communications at varying frequencies</li>
                <li>Access to caregiving information and resource recommendations</li>
              </ul>
              <p>
                <strong>The Service operates entirely through SMS/RCS text messaging—no app download is required.</strong> You can access GiveCare from any mobile phone capable of sending and receiving text messages.
              </p>
              <p>
                We reserve the right to modify, update, suspend, or discontinue any aspect of the Service at any time, with or without notice. We may also impose limits on certain features or restrict access to parts or all of the Service without notice or liability.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="heading-section">3. Eligibility and Account Requirements</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">3.1 Age Requirement</h3>
              <p>
                You must be at least 18 years of age to use the Service. By using GiveCare, you represent and warrant that you are 18 years of age or older.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">3.2 Account Registration</h3>
              <p>
                To use the Service, you must:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide a valid mobile phone number capable of receiving SMS messages</li>
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain and promptly update your account information to keep it accurate and current</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">3.3 Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account and phone number. You agree to notify us immediately at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a> of any unauthorized access or security breach.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="heading-section">4. Subscription and Billing</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">4.1 Pricing</h3>
              <p>
                GiveCare offers the following subscription plans:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Monthly Plan:</strong> $9.99 per month, billed monthly</li>
                <li><strong>Annual Plan:</strong> $99.00 per year, billed annually (saves $20 compared to monthly billing)</li>
              </ul>
              <p>
                All prices are in U.S. dollars and exclude applicable taxes. We reserve the right to change our pricing with 30 days' advance notice to active subscribers.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">4.2 Payment Processing</h3>
              <p>
                All payments are processed securely through Stripe, our third-party payment processor. By subscribing, you agree to provide current, complete, and accurate payment information. You authorize us to charge your selected payment method for the subscription fees.
              </p>
              <p>
                You are responsible for all charges incurred under your account. If a payment fails, we reserve the right to suspend or terminate your access to the Service until payment is received.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">4.3 Auto-Renewal</h3>
              <p>
                Your subscription will automatically renew at the end of each billing period (monthly or annually, depending on your plan) unless you cancel before the renewal date. You will be charged the then-current subscription rate for your plan upon renewal.
              </p>
              <p>
                We will send you a reminder before each renewal period. To avoid being charged for the next billing period, you must cancel your subscription before the renewal date.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">4.4 Cancellation</h3>
              <p>
                You may cancel your subscription at any time through your account settings or by contacting us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a>. There are no cancellation fees.
              </p>
              <p>
                Upon cancellation:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your subscription will remain active through the end of your current billing period</li>
                <li>You will continue to have access to the Service until the end of the paid period</li>
                <li>No refund will be provided for the remainder of the current billing period (except as provided in Section 4.5)</li>
                <li>Your subscription will not renew for the next billing period</li>
                <li>Your account data will be retained according to our Privacy Policy</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">4.5 Refund Policy</h3>
              <p>
                We offer a 7-day money-back guarantee for new subscribers:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If you cancel within 7 days of your initial subscription purchase, you will receive a full refund</li>
                <li>To request a refund, contact us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a> within the 7-day period</li>
                <li>Refunds are processed within 5-10 business days to your original payment method</li>
                <li>This money-back guarantee applies only to your first subscription purchase and does not apply to renewal charges</li>
              </ul>
              <p>
                Beyond the 7-day window, all subscription fees are non-refundable except as required by law or at our sole discretion.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">4.6 Free Trials</h3>
              <p>
                We may offer free trial periods from time to time. If you sign up for a free trial:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must provide payment information to access the trial</li>
                <li>You will be automatically charged at the end of the trial period unless you cancel before the trial ends</li>
                <li>We will notify you before the trial period ends</li>
                <li>Each customer is eligible for only one free trial</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="heading-section">5. SMS Terms and Consent</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">5.1 Consent to Receive Text Messages</h3>
              <p>
                By subscribing to GiveCare and providing your mobile phone number, you expressly consent to receive automated text messages (SMS and RCS) from GiveCare at the phone number you provided. This consent is not a condition of purchase.
              </p>
              <p>
                <strong>Message frequency varies.</strong> The number of messages you receive will depend on your usage of the Service, your responses to our AI agents, and your caregiving needs. You may receive multiple messages per day during active support periods, or fewer messages during quiet periods.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">5.2 Message and Data Rates</h3>
              <p>
                <strong>Message and data rates may apply.</strong> Standard SMS/RCS messaging rates from your mobile carrier will apply to all messages sent and received through the Service. GiveCare is not responsible for any charges you incur from your mobile carrier. Please contact your carrier for information about your messaging plan and rates.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">5.3 Supported Carriers</h3>
              <p>
                The Service is available on most major U.S. mobile carriers, including AT&T, T-Mobile, Verizon, Sprint, Boost, Cricket, MetroPCS, U.S. Cellular, Virgin Mobile, and others. Carrier coverage and availability may vary.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">5.4 Opt-Out Instructions</h3>
              <p>
                You may opt out of receiving text messages at any time:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>To stop all messages:</strong> Text STOP, END, CANCEL, UNSUBSCRIBE, or QUIT to any message from GiveCare</li>
                <li>You will receive a confirmation message that you have been unsubscribed</li>
                <li>After opting out, you will no longer receive messages from us unless you re-subscribe</li>
                <li>Opting out does not cancel your paid subscription—you must separately cancel your subscription to stop billing</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">5.5 Help Information</h3>
              <p>
                For help with text messages, text HELP to any message from GiveCare, or contact us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a>.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">5.6 Carrier Limitations and Liability</h3>
              <p>
                We are not liable for any delays, failures, or errors in message delivery caused by your mobile carrier or network provider. Carriers are not liable for delayed or undelivered messages. Message delivery and timing are not guaranteed.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">5.7 Changes to Phone Number</h3>
              <p>
                If you change your mobile phone number, you must update your account information immediately. We are not responsible for messages sent to an outdated phone number.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="heading-section">6. Medical Disclaimer and Limitations</h2>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 my-6">
                <p className="font-bold text-lg text-amber-900 mb-2">IMPORTANT MEDICAL DISCLAIMER</p>
                <p className="text-amber-900">
                  GiveCare is NOT a medical device, healthcare provider, or emergency service. The Service is designed to provide information, support, and resources for caregivers, but it does not provide medical advice, diagnosis, or treatment.
                </p>
              </div>

              <h3 className="text-xl font-bold mt-4 mb-2">6.1 Not Medical Advice</h3>
              <p>
                The information provided through GiveCare, including but not limited to text messages, assessments, recommendations, and resource referrals, is for informational and educational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <p>
                <strong>Always seek the advice of your physician or other qualified healthcare provider with any questions you may have regarding a medical condition or treatment.</strong> Never disregard professional medical advice or delay seeking it because of something you have received through the Service.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.2 Not an Emergency Service</h3>
              <p>
                <strong>GiveCare is not an emergency service and should not be used for emergency situations.</strong>
              </p>
              <p>
                If you or someone you are caring for is experiencing a medical emergency, call 911 immediately. Do not rely on the Service for emergency medical assistance.
              </p>
              <p>
                <strong>For mental health crises:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Call or text 988 for the Suicide and Crisis Lifeline</li>
                <li>Text "HELLO" to 741741 for the Crisis Text Line</li>
                <li>Call 911 if there is immediate danger</li>
              </ul>
              <p>
                GiveCare may provide referrals to these crisis resources, but we do not operate or control these services. They are independent third-party resources.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.3 No Doctor-Patient Relationship</h3>
              <p>
                Use of the Service does not create a doctor-patient, therapist-client, or any other healthcare professional relationship between you and GiveCare or any of our employees, contractors, or AI agents.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.4 Not HIPAA Covered</h3>
              <p>
                GiveCare is not a HIPAA-covered entity, and the Service is not designed to comply with the Health Insurance Portability and Accountability Act (HIPAA). Do not use the Service to transmit protected health information (PHI) as defined by HIPAA.
              </p>
              <p>
                While we implement security measures to protect your information (as described in our Privacy Policy), we cannot guarantee the same level of privacy protection required under HIPAA.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.5 User Responsibility for Medical Decisions</h3>
              <p>
                You are solely responsible for all decisions regarding medical care, treatment, and management of health conditions for yourself or those in your care. We strongly encourage you to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Consult with qualified healthcare professionals before making medical decisions</li>
                <li>Verify any information provided through the Service with your healthcare provider</li>
                <li>Follow your healthcare provider's instructions and treatment plans</li>
                <li>Seek immediate medical attention when appropriate</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">6.6 Assessment Tool Limitations</h3>
              <p>
                The clinical assessment tools provided through the Service (BSFC, EMA, CWBS, REACH-II, SDOH) are screening instruments designed to identify potential areas of concern. They are not diagnostic tools and do not replace professional clinical evaluation.
              </p>
              <p>
                Results from these assessments should be discussed with a qualified healthcare professional for proper interpretation and follow-up.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.7 Third-Party Resource Referrals</h3>
              <p>
                GiveCare may provide referrals to third-party resources, services, organizations, and crisis hotlines. These referrals are provided for informational purposes only. We do not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Operate, control, or endorse these third-party services</li>
                <li>Guarantee their availability, quality, or effectiveness</li>
                <li>Assume any responsibility for the services they provide</li>
                <li>Verify the credentials or qualifications of third-party providers</li>
              </ul>
              <p>
                Your use of any third-party resources is at your own risk and subject to their terms and policies.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">6.8 No Guarantee of Results</h3>
              <p>
                We make no guarantees, representations, or warranties regarding the effectiveness of the Service in reducing caregiver stress, improving well-being, or achieving any particular outcome. Individual results may vary.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="heading-section">7. AI and Automated Services Disclaimer</h2>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-6">
                <p className="font-bold text-lg text-blue-900 mb-2">IMPORTANT AI DISCLOSURE</p>
                <p className="text-blue-900">
                  GiveCare uses artificial intelligence (AI) technology to provide automated support. AI systems can make mistakes, provide inaccurate information, or misunderstand context. Always use human judgment and verify important information.
                </p>
              </div>

              <h3 className="text-xl font-bold mt-4 mb-2">7.1 AI-Generated Content</h3>
              <p>
                The text messages, recommendations, and responses you receive from GiveCare are generated by artificial intelligence algorithms and large language models. While we strive for accuracy, AI-generated content may:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contain factual errors or inaccuracies</li>
                <li>Misinterpret your messages or context</li>
                <li>Provide outdated or incomplete information</li>
                <li>Generate responses that sound confident but are incorrect</li>
                <li>Fail to recognize nuance, sarcasm, or cultural context</li>
                <li>Produce biased or inappropriate content despite our safeguards</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">7.2 No Human Review</h3>
              <p>
                Messages from our AI agents are generated automatically without real-time human review. While we implement safety measures and review systems to improve quality, we cannot review every message before it is sent to you.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">7.3 Automated Decision-Making</h3>
              <p>
                Our AI agents use automated decision-making to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Assess your responses to clinical assessments</li>
                <li>Identify potential crisis situations</li>
                <li>Route you to specialized support agents</li>
                <li>Recommend interventions and resources</li>
                <li>Personalize the content and frequency of messages</li>
              </ul>
              <p>
                These automated decisions are made based on algorithms and may not always be appropriate for your specific situation. You should always use your own judgment and consult with professionals when making important decisions.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">7.4 AI Limitations</h3>
              <p>
                You acknowledge and agree that AI technology has inherent limitations, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inability to truly understand emotions, context, or human experience</li>
                <li>Reliance on training data that may contain biases or inaccuracies</li>
                <li>Potential for "hallucinations" (generating plausible-sounding but false information)</li>
                <li>Difficulty handling complex, ambiguous, or unusual situations</li>
                <li>Lack of common sense reasoning or real-world understanding</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">7.5 Report Issues</h3>
              <p>
                If you receive a message that seems incorrect, inappropriate, or concerning, please:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Do not rely on that information for important decisions</li>
                <li>Verify the information with trusted sources or professionals</li>
                <li>Report the issue to us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a></li>
              </ul>
              <p>
                We use feedback to improve our AI systems, but we cannot guarantee that similar issues will not occur in the future.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">7.6 No Liability for AI Errors</h3>
              <p>
                To the fullest extent permitted by law, GiveCare is not liable for any damages, losses, or harm arising from AI-generated content, automated decisions, or errors made by our AI systems. This includes but is not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Inaccurate, incomplete, or misleading information</li>
                <li>Inappropriate or offensive content</li>
                <li>Failure to detect crisis situations</li>
                <li>Incorrect assessment results or recommendations</li>
                <li>Decisions made in reliance on AI-generated content</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="heading-section">8. User Conduct and Prohibited Uses</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">8.1 Acceptable Use</h3>
              <p>
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for all activity that occurs under your account.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">8.2 Prohibited Conduct</h3>
              <p>
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations</li>
                <li>Provide false, inaccurate, or misleading information</li>
                <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
                <li>Attempt to gain unauthorized access to the Service, other users' accounts, or our systems</li>
                <li>Use automated tools, bots, or scripts to interact with the Service (other than the AI agents we provide)</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
                <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                <li>Send spam, unsolicited communications, or harassing messages</li>
                <li>Upload or transmit viruses, malware, or other malicious code</li>
                <li>Violate the intellectual property rights of GiveCare or any third party</li>
                <li>Collect or harvest information about other users without their consent</li>
                <li>Use the Service to harm, threaten, or harass any person</li>
                <li>Attempt to manipulate or "jailbreak" our AI systems to generate inappropriate content</li>
                <li>Use the Service for any commercial purpose without our written permission</li>
                <li>Share your account credentials with others</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">8.3 Consequences of Prohibited Use</h3>
              <p>
                Violation of these prohibited uses may result in immediate termination or suspension of your account without refund, and we may pursue legal action if necessary. We reserve the right to investigate suspected violations and cooperate with law enforcement authorities.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="heading-section">9. Intellectual Property</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">9.1 GiveCare Intellectual Property</h3>
              <p>
                The Service, including all content, features, functionality, software, text, graphics, logos, and designs, is owned by GiveCare and is protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p>
                GiveCare™ and all related marks, logos, and service names are trademarks or registered trademarks of GiveCare. You may not use these marks without our prior written permission.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">9.2 Limited License</h3>
              <p>
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial use as a caregiver.
              </p>
              <p>
                This license does not include any right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reproduce, distribute, or create derivative works from the Service</li>
                <li>Use the Service for commercial purposes</li>
                <li>Modify, reverse engineer, or attempt to extract the source code</li>
                <li>Remove or alter any proprietary notices or labels</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">9.3 User Content</h3>
              <p>
                You retain ownership of any text messages, responses, or other content you submit to the Service ("User Content"). However, by submitting User Content, you grant GiveCare a worldwide, non-exclusive, royalty-free, perpetual, irrevocable license to use, reproduce, modify, and analyze your User Content for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing and operating the Service</li>
                <li>Improving and developing the Service and our AI models</li>
                <li>Creating aggregated, de-identified data for research and analytics</li>
                <li>Complying with legal obligations</li>
              </ul>
              <p>
                We will handle your User Content in accordance with our Privacy Policy. We will not share your personally identifiable User Content with third parties except as described in our Privacy Policy.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">9.4 Feedback</h3>
              <p>
                If you provide feedback, suggestions, or ideas about the Service, you grant us the right to use that feedback without any obligation to compensate you. We may use feedback to improve the Service or develop new features.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="heading-section">10. Privacy and Data Use</h2>
              <p>
                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our <a href="/privacy" className="text-amber-700 hover:text-amber-800 underline">Privacy Policy</a>, which is incorporated into these Terms by reference.
              </p>
              <p>
                By using the Service, you consent to our collection and use of your information as described in the Privacy Policy. Key points include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We collect information you provide (phone number, messages, assessment responses) and usage information</li>
                <li>We use your information to provide the Service, improve our AI models, and send you relevant support</li>
                <li>We implement security measures to protect your data, but no system is 100% secure</li>
                <li>We may share data with service providers (like Stripe, Twilio, OpenAI) who help us operate the Service</li>
                <li>We may use de-identified, aggregated data for research and analytics</li>
                <li>We will not sell your personal information to third parties</li>
              </ul>
              <p>
                Please review our Privacy Policy for complete details about our data practices.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="heading-section">11. Service Availability and Modifications</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">11.1 Service Availability</h3>
              <p>
                We strive to provide reliable access to the Service, but we do not guarantee that the Service will be available at all times or without interruption. The Service may be unavailable due to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Scheduled maintenance or updates</li>
                <li>Technical issues, server outages, or network problems</li>
                <li>Mobile carrier or telecommunications service disruptions</li>
                <li>Circumstances beyond our reasonable control (force majeure events)</li>
                <li>Security incidents or attacks</li>
              </ul>
              <p>
                We are not liable for any downtime, service interruptions, or unavailability of the Service.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">11.2 Modifications to Service</h3>
              <p>
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Features and functionality</li>
                <li>AI agent capabilities and behavior</li>
                <li>Assessment tools and interventions</li>
                <li>Message frequency and content</li>
                <li>Supported phone numbers or carriers</li>
              </ul>
              <p>
                We will make reasonable efforts to notify you of material changes, but we are not required to provide advance notice. Continued use of the Service after modifications constitutes acceptance of the changes.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">11.3 No Warranty of Uninterrupted Service</h3>
              <p>
                You acknowledge that the Service depends on third-party infrastructure (including mobile carriers, internet providers, cloud services, and AI models) that may experience interruptions, delays, or failures. We do not warrant that the Service will operate error-free or without delays.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="heading-section">12. Disclaimer of Warranties</h2>

              <div className="bg-gray-100 border border-gray-300 p-6 my-6">
                <p className="font-bold uppercase mb-4">IMPORTANT: PLEASE READ CAREFULLY</p>
                <p>
                  THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED.
                </p>
                <p className="mt-4">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, GIVECARE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                  <li>WARRANTIES REGARDING THE ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
                  <li>WARRANTIES THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE</li>
                  <li>WARRANTIES REGARDING THE RESULTS OBTAINED FROM USING THE SERVICE</li>
                  <li>WARRANTIES THAT DEFECTS WILL BE CORRECTED</li>
                </ul>
              </div>

              <p>
                Specifically, we do not warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The AI-generated content will be accurate, appropriate, or useful</li>
                <li>Our AI agents will correctly understand your messages or situation</li>
                <li>The clinical assessments will accurately reflect your condition or needs</li>
                <li>The interventions or recommendations will be effective or suitable for you</li>
                <li>Crisis detection systems will identify all crisis situations</li>
                <li>Third-party resources we refer you to will be available or helpful</li>
                <li>Messages will be delivered promptly or at all</li>
                <li>The Service will be compatible with your device or carrier</li>
                <li>Your data will be completely secure from unauthorized access</li>
              </ul>

              <p className="mt-4">
                You use the Service at your own risk and discretion. Any material downloaded or otherwise obtained through the Service is accessed at your own risk, and you will be solely responsible for any damage to your device or loss of data.
              </p>

              <p className="mt-4">
                Some jurisdictions do not allow the exclusion of implied warranties, so some of the above exclusions may not apply to you. In such cases, our warranties will be limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="heading-section">13. Limitation of Liability</h2>

              <div className="bg-gray-100 border border-gray-300 p-6 my-6">
                <p className="font-bold uppercase mb-4">IMPORTANT: PLEASE READ CAREFULLY</p>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL GIVECARE, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                </p>
              </div>

              <p>
                This limitation of liability includes, but is not limited to, damages for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal injury, emotional distress, or loss of life</li>
                <li>Medical expenses or costs of care</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Cost of substitute services</li>
                <li>Errors, omissions, or inaccuracies in AI-generated content</li>
                <li>Failure to detect crisis situations or prevent harm</li>
                <li>Reliance on information, recommendations, or referrals provided through the Service</li>
                <li>Interruptions, delays, or unavailability of the Service</li>
                <li>Unauthorized access to your account or data</li>
                <li>Actions or inactions of third-party services we refer you to</li>
                <li>Any other matter relating to the Service</li>
              </ul>

              <p className="mt-4">
                This limitation applies regardless of the legal theory on which the claim is based (whether contract, tort, negligence, strict liability, or otherwise) and even if we have been advised of the possibility of such damages.
              </p>

              <p className="mt-4">
                <strong>MAXIMUM LIABILITY:</strong> To the fullest extent permitted by law, our total aggregate liability to you for all claims arising out of or related to the Service or these Terms shall not exceed the greater of (a) $100 or (b) the amount you paid to GiveCare in the 12 months preceding the claim.
              </p>

              <p className="mt-4">
                Some jurisdictions do not allow the exclusion or limitation of incidental or consequential damages, so the above limitations may not apply to you. In such cases, our liability will be limited to the maximum extent permitted by law.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">13.1 Basis of the Bargain</h3>
              <p>
                You acknowledge and agree that these disclaimers and limitations of liability are fundamental elements of the agreement between you and GiveCare. The Service would not be provided to you at the current subscription price without these limitations.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="heading-section">14. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless GiveCare, its officers, directors, employees, agents, affiliates, and licensors from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from or related to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or misuse of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another person or entity</li>
                <li>Your User Content</li>
                <li>Any decisions or actions you take based on information from the Service</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
              <p className="mt-4">
                We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you, and you agree to cooperate with our defense of such claims. This indemnification obligation will survive termination of these Terms and your use of the Service.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="heading-section">15. Termination</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">15.1 Termination by You</h3>
              <p>
                You may terminate your account at any time by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Canceling your subscription through your account settings</li>
                <li>Contacting us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a></li>
                <li>Texting STOP to opt out of messages (note: this stops messages but does not cancel your paid subscription)</li>
              </ul>
              <p>
                Upon termination, your access to the Service will continue through the end of your current billing period, and you will not be charged for subsequent billing periods.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">15.2 Termination by GiveCare</h3>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Breach of these Terms</li>
                <li>Failure to pay subscription fees</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Requests by law enforcement or government agencies</li>
                <li>Discontinuation of the Service</li>
                <li>Prolonged inactivity</li>
                <li>At our sole discretion for any other reason</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">15.3 Effect of Termination</h3>
              <p>
                Upon termination of your account:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your right to use the Service will immediately cease</li>
                <li>You will no longer receive text messages from GiveCare</li>
                <li>We may delete your account data in accordance with our Privacy Policy</li>
                <li>Provisions of these Terms that by their nature should survive termination will survive, including intellectual property provisions, disclaimers, limitations of liability, and indemnification</li>
              </ul>

              <h3 className="text-xl font-bold mt-4 mb-2">15.4 No Refunds Upon Termination</h3>
              <p>
                If we terminate your account for breach of these Terms, you will not be entitled to a refund of any unused portion of your subscription fees.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="heading-section">16. Governing Law and Dispute Resolution</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">16.1 Governing Law</h3>
              <p>
                These Terms and your use of the Service shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law principles.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">16.2 Informal Dispute Resolution</h3>
              <p>
                Before filing a formal legal claim, you agree to first contact us at <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a> to attempt to resolve the dispute informally. We will work with you in good faith to reach a mutually satisfactory resolution.
              </p>
              <p>
                Please provide a detailed description of the dispute and your desired resolution. We will respond within 30 days. If we cannot resolve the dispute informally within 60 days, either party may proceed with formal dispute resolution.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">16.3 Venue and Jurisdiction</h3>
              <p>
                If a dispute cannot be resolved informally, you agree that any legal action or proceeding arising out of or related to these Terms or the Service shall be brought exclusively in the state or federal courts located in New York County, New York. You consent to the personal jurisdiction of these courts and waive any objection to venue.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">16.4 Class Action Waiver</h3>
              <p>
                To the extent permitted by law, you and GiveCare agree that any claims must be brought in the parties' individual capacity, and not as a plaintiff or class member in any purported class, collective, representative, multiple plaintiff, or similar proceeding.
              </p>
              <p>
                You and GiveCare expressly waive any ability to maintain any class action, private attorney general action, or other representative action in any forum.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">16.5 Time Limitation on Claims</h3>
              <p>
                You agree that any claim or cause of action arising out of or related to the Service or these Terms must be filed within one (1) year after the claim or cause of action arose, or it will be permanently barred.
              </p>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="heading-section">17. Changes to Terms</h2>
              <p>
                We reserve the right to modify or update these Terms at any time at our sole discretion. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Post the updated Terms on our website at givecareapp.com/terms</li>
                <li>Update the "Last Updated" date at the top of these Terms</li>
                <li>Send you a notification via text message or email</li>
              </ul>
              <p className="mt-4">
                Material changes will be effective 30 days after we provide notice. Non-material changes will be effective immediately upon posting.
              </p>
              <p className="mt-4">
                Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the changes. If you do not agree to the updated Terms, you must stop using the Service and cancel your subscription before the effective date.
              </p>
              <p className="mt-4">
                We encourage you to review these Terms periodically to stay informed about your rights and obligations.
              </p>
            </section>

            {/* Section 18 */}
            <section>
              <h2 className="heading-section">18. General Provisions</h2>

              <h3 className="text-xl font-bold mt-4 mb-2">18.1 Entire Agreement</h3>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and GiveCare regarding the Service and supersede all prior agreements and understandings.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.2 Severability</h3>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions will continue in full force and effect. The invalid provision will be modified to the minimum extent necessary to make it valid and enforceable.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.3 Waiver</h3>
              <p>
                Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or our right to enforce it in the future. Any waiver must be in writing and signed by an authorized representative of GiveCare.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.4 Assignment</h3>
              <p>
                You may not assign or transfer these Terms or your rights under them without our prior written consent. We may assign these Terms without restriction, including to any affiliate or in connection with a merger, acquisition, or sale of assets.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.5 No Third-Party Beneficiaries</h3>
              <p>
                These Terms do not create any third-party beneficiary rights. The Terms are solely for the benefit of you and GiveCare.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.6 Force Majeure</h3>
              <p>
                We will not be liable for any delay or failure to perform resulting from causes beyond our reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, labor disputes, or governmental actions.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.7 Electronic Communications</h3>
              <p>
                By using the Service, you consent to receive electronic communications from us, including text messages, emails, and notices posted on our website. You agree that all agreements, notices, disclosures, and other communications we provide electronically satisfy any legal requirement that such communications be in writing.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.8 Export Compliance</h3>
              <p>
                The Service may be subject to U.S. export control laws. You agree to comply with all applicable export and import laws and regulations. You represent that you are not located in a country subject to U.S. government embargo or designated as a "terrorist supporting" country, and that you are not on any U.S. government list of prohibited or restricted parties.
              </p>

              <h3 className="text-xl font-bold mt-4 mb-2">18.9 Survival</h3>
              <p>
                The following provisions will survive termination of these Terms: intellectual property provisions, disclaimers, limitations of liability, indemnification, governing law, and any other provisions that by their nature should survive.
              </p>
            </section>

            {/* Section 19 */}
            <section>
              <h2 className="heading-section">19. Contact Information</h2>
              <p>
                If you have any questions, concerns, or feedback about these Terms or the Service, please contact us:
              </p>
              <div className="bg-base-200 p-6 rounded-lg mt-4">
                <p className="font-bold mb-2">GiveCare Support</p>
                <p>Email: <a href="mailto:support@givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">support@givecareapp.com</a></p>
                <p>Website: <a href="https://givecareapp.com" className="text-amber-700 hover:text-amber-800 underline">givecareapp.com</a></p>
                <p className="mt-4">For text message support, reply HELP to any message from GiveCare.</p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-amber-50 border-l-4 border-amber-500 p-6 mt-8">
              <p className="font-bold text-lg mb-2">Acknowledgment</p>
              <p>
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
              </p>
              <p className="mt-4">
                You also acknowledge that:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>GiveCare is not a medical service or emergency service</li>
                <li>The Service uses AI technology that can make mistakes</li>
                <li>You are responsible for all medical decisions</li>
                <li>You should always consult healthcare professionals for medical advice</li>
                <li>You should call 911 or appropriate crisis services in emergencies</li>
              </ul>
            </section>

          </div>
        </div>
      </section>
    </>
  );
}
