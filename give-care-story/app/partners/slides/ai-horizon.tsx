import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function AIHorizonSlide() {
  const horizonTrends = [
    {
      timeframe: "Next 2-3 Years",
      developments: [
        "Multimodal AI (voice, text, images)",
        "Real-time emotion detection",
        "Predictive health insights",
        "Enhanced care coordination"
      ],
      status: "Near-term"
    },
    {
      timeframe: "5-7 Years",
      developments: [
        "AI-powered care robots",
        "Virtual reality therapy sessions",
        "Genomic-informed care plans",
        "Seamless EMR integration"
      ],
      status: "Medium-term"
    },
    {
      timeframe: "10+ Years",
      developments: [
        "Fully autonomous care assistants",
        "Brain-computer interfaces",
        "Personalized medicine at scale",
        "Preventive care ecosystems"
      ],
      status: "Long-term"
    }
  ];

  const challenges = [
    "Regulatory frameworks lag behind innovation",
    "Data privacy and security concerns",
    "Healthcare provider adoption barriers",
    "Ensuring equitable access to AI tools"
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FFE8D6] overflow-y-auto">
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-8">
        <div className="max-w-6xl w-full">
          <motion.div 
            className="text-center mb-xl"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-heading text-3xl mb-md">What's on the Horizon</h1>
            <p className="font-body text-md text-amber-700">The future of AI in healthcare and advocacy</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-xl">
            {horizonTrends.map((trend, index) => (
              <motion.div
                key={`trend-${trend.status.toLowerCase()}`}
                className="bg-white/90 rounded-xl p-6 shadow-lg"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="text-center mb-lg">
                  <h3 className="font-heading text-lg text-slate-800 mb-sm">{trend.timeframe}</h3>
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-body">
                    {trend.status}
                  </span>
                </div>
                <ul className="space-y-3">
                  {trend.developments.map((item, itemIndex) => (
                    <li 
                      key={`dev-${itemIndex}`}
                      className="font-body text-sm text-slate-700 border-l-4 border-[#54340E] pl-4"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="bg-amber-50 rounded-xl p-6 mb-lg"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="font-heading text-lg text-slate-800 mb-md text-center">Key Challenges Ahead</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge, index) => (
                <div 
                  key={`challenge-${index}`}
                  className="font-body text-sm text-slate-700 border-l-4 border-amber-500 pl-4"
                >
                  {challenge}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="font-body text-sm text-amber-700 text-center"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p>The question isn't whether AI will transform caregiving—it's how we'll shape that transformation.</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}