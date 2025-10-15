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
          
          <motion.div 
            className="pt-8 border-t border-white/20 mt-8"
            variants={textVariants}
            custom={descriptionLines.length + 1}
          >
            <a 
              href="https://www.givecareapp.com/news/tea-and-cake" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-body text-sm text-white/80 hover:text-white hover:underline inline-flex items-center"
            >
              Tea, Cake & Existential Anxiety: Notes from a Pop-Up Death Café
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
