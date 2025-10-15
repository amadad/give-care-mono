'use client';

import { motion } from 'framer-motion';

const smsFeatures = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Text to start",
    description: "Send a message, get instant support. No account creation, no password, no email verification."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Instant replies",
    description: "Get support in seconds, not days. No waiting 24-48 hours for a callback."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    title: "Works offline",
    description: "SMS fallback when data unavailable. No Wi-Fi? No problem."
  }
];

export default function SMSFirstSection() {
  return (
    <section className="section-standard bg-white">
      <div className="container-editorial">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="heading-section mb-4">
            No app required. Seriously.
          </h2>
          <p className="body-large max-w-2xl mx-auto">
            Works on flip phones, smartphones, any device with SMS.
            No downloads. No passwords. No smartphone required.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {smsFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Accessibility Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Screen reader compatible • Large text mode supported • Voice-to-text enabled •
            Works with assistive technology
          </p>
        </motion.div>
      </div>
    </section>
  );
}
