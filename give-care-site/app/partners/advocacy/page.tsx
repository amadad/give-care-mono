import { Metadata } from 'next';
import Hero from './components/Hero';
import Features from './components/Features';
import CTASection from './components/CTASection';
import { FaUsers, FaChartLine, FaShieldAlt, FaHandHoldingHeart } from 'react-icons/fa';
import LogoMarquee from '@/app/components/LogoMarquee';
import Testimonials from '@/app/components/sections/Testimonials';

export const metadata: Metadata = {
  title: 'Advocacy & Non-Profit Partners - GiveCare',
  description: 'Extend your impact with AI-powered support for caregivers. Scale your mission without scaling your staff.',
  keywords: ['caregiver support', 'nonprofit partnership', 'AI for good', 'caregiver advocacy', 'mental health support']
};

export default function AdvocacyNonprofitPage() {
  // Benefits for advocacy organizations
  const benefits = [
    {
      icon: <FaUsers className="h-6 w-6" />,
      title: "Amplify Your Reach",
      description: "Support 5× more caregivers with the same staff."
    },
    {
      icon: <FaShieldAlt className="h-6 w-6" />,
      title: "Privacy by Default",
      description: "Minimal data, row-level security, no PHI stored."
    },
    {
      icon: <FaHandHoldingHeart className="h-6 w-6" />,
      title: "24/7 Mission Presence",
      description: "Caregivers get answers at 2 AM; volunteers focus on high-touch advocacy."
    },
    {
      icon: <FaChartLine className="h-6 w-6" />,
      title: "Data-Driven Advocacy",
      description: "Aggregate trends strengthen grant apps and policy briefs."
    }
  ];

  return (
    <>
      <div className="relative">
          <Hero />
          <div className="w-full -mt-4">
            <LogoMarquee />
          </div>
        </div>

        {/* Testimonials Section */}
        <Testimonials />

        {/* Features Section */}
        <Features />

        {/* Benefits Section */}
        <section className="w-full py-16 bg-base-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="heading-section mb-4">Benefits for Advocacy Organizations</h2>
              <p className="text-lg text-amber-800/80 max-w-2xl mx-auto">
                Why your leadership, funders, and volunteers will care.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-base-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-amber-100 p-3 rounded-full mb-4 text-amber-700">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-light mb-2">{benefit.title}</h3>
                  <p className="text-amber-800/90">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* CTA Section */}
      <CTASection />
    </>
  );
}
