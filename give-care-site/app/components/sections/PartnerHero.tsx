import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

interface PartnerHeroProps {
  badge: string;
  title: string;
  description: string;
  primaryButtonText: string;
  calendarLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function PartnerHero({
  badge,
  title,
  description,
  primaryButtonText,
  calendarLink = "https://cal.com/amadad/givecare?overlayCalendar=true",
  secondaryButtonText = "See How It Works",
  secondaryButtonLink = "/how-it-works"
}: PartnerHeroProps) {
  return (
    <div className="w-full bg-gradient-to-b from-base-100 via-amber-50 to-transparent pt-16">
      <div className="container mx-auto px-4 pb-12 md:pt-8 md:pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6 mx-auto">
            <span>{badge}</span>
          </div>
          
          <h1 className="heading-hero">
            {title}
          </h1>
          
          <p className="text-xl text-amber-800/90 leading-relaxed max-w-3xl mx-auto">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
            <a
              href={calendarLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-editorial-primary"
            >
              {primaryButtonText}
              <FaArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a
              href={secondaryButtonLink}
              className="btn-editorial-secondary"
            >
              {secondaryButtonText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}