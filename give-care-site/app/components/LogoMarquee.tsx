'use client';
import Image from 'next/image';

interface Logo {
  name: string;
  src: string;
  scale?: number;
}

const logos: Logo[] = [
  { name: 'Logo 01', src: '/logos/logo-01.png' },
  { name: 'OpenAI', src: '/logos/oai.svg' },
  { name: 'Alliance of Professional Health Advocates', src: '/logos/logo-04.png', scale: 1.2 },
  { name: 'Logo 04', src: '/logos/logo-05.png' },
  { name: 'Logo 05', src: '/logos/logo-03.png' },
];

interface LogoMarqueeProps {
  tagline?: string;
}

export default function LogoMarquee({ tagline = "Trusted by Leaders in Technology & Healthcare" }: LogoMarqueeProps) {
  return (
    <div className="w-full bg-base-100">
      <div className="container mx-auto px-4 py-8">
        <p className="mb-8 text-center text-sm font-medium text-base-content/70">
          {tagline}
        </p>
        <div className="logo-grid">
          {logos.map((logo, index) => (
            <div key={logo.name} className="logo-item">
              <div className="relative w-full h-full" style={logo.scale ? { transform: `scale(${logo.scale})` } : undefined}>
                <Image
                  src={logo.src}
                  alt={logo.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 120px, 160px"
                  priority={index < 3}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
