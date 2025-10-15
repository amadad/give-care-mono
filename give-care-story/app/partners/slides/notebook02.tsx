'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const images = Array.from({ length: 10 }, (_, i) => ({
  src: `/n${String(i + 1).padStart(2, '0')}.webp`,
  alt: `Image ${i + 1}`
}));

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Slide4() {
  const router = useRouter();
  
  const handleImageClick = () => {
    router.push('/dignity/5');
  };

  return (
    <div className="relative h-screen w-full bg-[#FFE8D6] overflow-hidden p-4 md:p-8">
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 w-full h-full"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {images.map((img, index) => (
          <motion.div 
            key={`image-${img.src}`} 
            variants={item}
            className="relative w-full aspect-[3/4] cursor-pointer"
            onClick={handleImageClick}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-contain p-1 md:p-2"
              priority={index < 4} // Only load first 4 images eagerly
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}