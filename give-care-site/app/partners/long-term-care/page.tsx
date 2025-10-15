import { Metadata } from 'next';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import CTASection from './components/CTASection';
import LogoMarquee from '@/app/components/LogoMarquee';
import Testimonials from '@/app/components/sections/Testimonials';

export const metadata: Metadata = {
  title: 'Long-Term Care Partners | GiveCare',
  description: 'Extend your care team with AI-powered support for long-term care facilities. 24/7 SMS-based assistance for caregivers and residents.',
  keywords: ['long term care', 'senior care', 'caregiver support', 'nursing home technology', 'elderly care']
};

export default function LongTermCarePage() {

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="relative">
          <Hero />
          <div className="w-full -mt-4">
            <LogoMarquee tagline="Trusted by Care-Delivery Innovators" />
          </div>
        </div>
        
        {/* Testimonials Section */}
        <Testimonials />
        
        <Features />
        <CTASection />

      </main>
      <Footer />
    </div>
  );
}
