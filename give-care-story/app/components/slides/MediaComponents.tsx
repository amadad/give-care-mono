import Image from 'next/image';
import { ReactNode } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'light' | 'dark';
  href?: string;
}

export function GiveCareLogo({ size = 100, className = '', variant = 'light', href }: LogoProps) {
  const variantClasses = variant === 'light' ? 'brightness-0 invert' : '';
  
  const logoElement = (
    <Image
      src="/gc-s.svg"
      alt="Give Care Logo"
      width={size}
      height={size}
      className={`mx-auto ${variantClasses}`}
      priority
    />
  );
  
  return (
    <div className={`mx-auto mb-6 ${className}`}>
      {href ? (
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          {logoElement}
        </a>
      ) : (
        logoElement
      )}
    </div>
  );
}

interface FullscreenImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function FullscreenImage({ src, alt, className = '' }: FullscreenImageProps) {
  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}

interface ImageCardProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  caption?: string;
  link?: string;
}

export function ImageCard({ 
  src, 
  alt, 
  width = 560, 
  height = 700, 
  className = '',
  caption,
  link 
}: ImageCardProps) {
  const content = (
    <div className={`relative bg-white rounded-xl shadow-xl ${className}`}>
      <div className="p-8 h-full w-full flex items-center justify-center">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      {content}
      {caption && (
        <div className="text-center">
          {link ? (
            <a 
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm hover:underline"
              style={{ color: 'var(--color-text-amber-700)' }}
            >
              {caption}
            </a>
          ) : (
            <p className="font-body text-sm" style={{ color: 'var(--color-text-amber-700)' }}>{caption}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative w-[375px] h-[812px] mx-auto ${className}`}>
      <Image
        src="/Group.webp"
        alt="Phone frame"
        fill
        className="object-contain"
        priority
      />
      <div className="absolute inset-[160px_16px_120px] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}