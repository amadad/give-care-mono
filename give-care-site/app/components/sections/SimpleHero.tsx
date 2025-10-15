import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

interface SimpleHeroProps {
  title: string;
  description?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
  ctaIsExternal?: boolean;
  variant?: 'success' | 'cancel' | 'default';
}

export default function SimpleHero({
  title,
  description,
  showCTA = false,
  ctaText = "Continue",
  ctaHref = "/",
  ctaIsExternal = false,
  variant = 'default'
}: SimpleHeroProps) {
  const variantStyles = {
    success: 'from-success/10 via-base-100 to-transparent',
    cancel: 'from-warning/10 via-base-100 to-transparent',
    default: 'from-base-100 via-base-200 to-transparent'
  };

  const variantTextStyles = {
    success: 'text-success',
    cancel: 'text-warning',
    default: 'text-base-content'
  };

  const variantButtonStyles = {
    success: 'btn-success',
    cancel: 'btn-warning',
    default: 'btn-primary'
  };

  return (
    <div className={`w-full bg-gradient-to-b ${variantStyles[variant]} pt-24 pb-16`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className={`text-4xl md:text-5xl font-bold ${variantTextStyles[variant]} leading-tight`}>
            {title}
          </h1>
          
          {description && (
            <p className="text-xl text-base-content/80 leading-relaxed">
              {description}
            </p>
          )}
          
          {showCTA && (
            <div className="pt-4">
              {ctaIsExternal ? (
                <a 
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn ${variantButtonStyles[variant]} btn-lg px-8 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
                >
                  {ctaText}
                  <FaArrowRight className="ml-2 h-4 w-4" />
                </a>
              ) : (
                <Link 
                  href={ctaHref}
                  className={`btn ${variantButtonStyles[variant]} btn-lg px-8 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
                >
                  {ctaText}
                  <FaArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}