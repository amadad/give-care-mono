import { motion } from 'framer-motion';

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: "easeOut"
    }
  })
};

export default function Slide1A() {
  const descriptionLines = [
    "The crows gathered ten days into spring,",
    "the season my mother passed.",
    "Four years after dad, seven years of caregiving complete—",
    "ALS, dementia, all of it.",
    "They filled the trees like they knew,",
    "not flying, just watching.",
    "From winter to spring, from death to life,",
    "from son to witness.",
    "Their presence felt like punctuation—",
    "a final period at the end of a long, unseen sentence."
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Using global video element */}
      <div className="absolute inset-0 z-0">
        <div className="fixed inset-0">
          <video
            id="bg-video"
            autoPlay
            loop
            muted
            playsInline
            className="h-screen w-screen object-cover"
            src="/crow.mp4"
          />
        </div>
      </div>
      
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      
      {/* Animated text content */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          className="max-w-4xl mx-auto space-y-6"
          initial="hidden"
          animate="visible"
          data-video-slide="true"
        >
          <motion.h2 
            className="font-heading text-3xl mb-2xl"
            variants={textVariants}
            custom={0}
          >
            Black Benediction
          </motion.h2>
          
          <div className="space-y-4 font-body text-lg">
            {descriptionLines.map((line, index) => (
              <motion.p 
                key={index}
                variants={textVariants}
                custom={index + 1}
                className="leading-relaxed"
              >
                {line}
              </motion.p>
            ))}
          </div>
          

        </motion.div>
      </div>
    </div>
  );
}
