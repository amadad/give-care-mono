import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function AITodaySlide() {
  const currentApplications = [
    {
      area: "Clinical Support",
      examples: ["Diagnostic assistance", "Treatment recommendations", "Drug interaction checks"]
    },
    {
      area: "Administrative",
      examples: ["Scheduling optimization", "Documentation automation", "Prior authorization"]
    },
    {
      area: "Patient Engagement", 
      examples: ["Symptom tracking", "Medication reminders", "Educational chatbots"]
    },
    {
      area: "Care Coordination",
      examples: ["Provider communication", "Care plan management", "Resource navigation"]
    }
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FFE8D6]">
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-8">
        <div className="max-w-5xl w-full">
          <motion.div 
            className="text-center mb-2xl"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading text-3xl mb-md">AI in Healthcare Today</h1>
            <p className="font-body text-md text-amber-700">Current applications and proven impact</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-xl">
            {currentApplications.map((item, index) => (
              <motion.div
                key={`ai-area-${item.area.replace(/\s+/g, '-').toLowerCase()}`}
                className="bg-white/90 rounded-xl p-8 shadow-lg"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h3 className="font-heading text-xl mb-md text-slate-800">{item.area}</h3>
                <ul className="space-y-2">
                  {item.examples.map((example, exIndex) => (
                    <li 
                      key={`example-${exIndex}`}
                      className="font-body text-md text-slate-700 border-l-4 border-[#54340E] pl-4"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="font-body text-sm text-amber-700 text-center absolute bottom-8 left-0 right-0"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <p>AI is already transforming healthcare delivery, but caregiving support remains largely untapped.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}