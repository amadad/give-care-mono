"use client"

import { motion } from 'framer-motion'

const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
}

export default function Slide20() {
  const microInterventions = [
    "Breathing exercises",
    "Mindfulness prompts",
    "Quick mood check",
    "Short gratitude practice",
    "5-minute stretch routine",
    "Grounding technique",
    "Hydration reminder",
    "Suggest a short walk",
    "Journaling cue",
    "Check-in with a friend"
  ]

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FFE8D6]">
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <motion.h1 
            className="font-heading text-3xl mb-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Micro-Interventions
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {microInterventions.map((item, index) => (
              <motion.div
                key={`micro-${item.replace(/\s+/g, '-').toLowerCase()}`}
                className="font-body text-md border-l-4 border-[#54340E] pl-4 py-2"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
              >
                {item}
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="font-body text-sm text-amber-700 text-center absolute bottom-8 left-0 right-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: microInterventions.length * 0.1 + 0.5 }}
          >
            <p>The AI suggests these brief actions when appropriate, but complex needs are escalated.</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
