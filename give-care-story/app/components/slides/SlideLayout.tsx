import { ReactNode } from 'react';

interface SlideLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'cream' | 'dark' | 'video' | 'custom';
  backgroundImage?: string;
  videoSrc?: string;
}

export function SlideLayout({ 
  children, 
  className = '', 
  variant = 'cream',
  backgroundImage,
  videoSrc 
}: SlideLayoutProps) {
  const baseClasses = "relative h-screen w-full overflow-hidden";
  
  const variantClasses = {
    cream: "slide-cream",
    dark: "slide-dark",
    video: "bg-[#54340E]",
    custom: ""
  };
  
  const videoDataAttr = variant === 'video' ? { 'data-video-slide': 'true' } : {};

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...videoDataAttr}>
      {/* Background Layer */}
      {variant === 'video' && videoSrc && (
        <div className="absolute inset-0 z-0">
          <div className="fixed inset-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="h-screen w-screen object-cover"
              src={videoSrc}
            />
          </div>
        </div>
      )}
      
      {backgroundImage && (
        <div className="absolute inset-0 w-full h-full">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Content Layer */}
      <div className="relative z-10 h-full w-full font-body">
        {children}
      </div>
    </div>
  );
}