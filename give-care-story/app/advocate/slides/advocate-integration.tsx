import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

export default function AdvocateNetworkSlide() {
  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <motion.div 
          className="text-center mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-heading text-3xl mb-4 text-amber-900">What's Next</h1>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            className="bg-white/90 rounded-xl p-6 shadow-lg"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-3">🤝</div>
              <h2 className="font-heading text-xl text-amber-900 mb-3">
                Caregiver-Advocate Network
              </h2>
              <p className="font-body text-sm text-amber-800">
                Exploring caregiver-advocate connections
              </p>
            </div>
          </motion.div>

          <motion.div
            className="bg-white/90 rounded-xl p-6 shadow-lg"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center">
              <div className="text-2xl mb-3">🧭</div>
              <h2 className="font-heading text-xl text-amber-900 mb-3">
                Caregiver Resource Navigator
              </h2>
              <p className="font-body text-sm text-amber-800">
                Personalized guidance to local and national resources
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}