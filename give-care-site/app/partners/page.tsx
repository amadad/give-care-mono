'use client';

import LogoMarquee from '@/app/components/LogoMarquee';
import { motion } from 'framer-motion';
import { HeartIcon, BriefcaseIcon, UsersIcon, HomeModernIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';


const partners = [
  {
    category: 'Health Plans & Payers',
    pain: 'Overwhelmed family caregivers drive up readmissions.',
    benefit: 'Direct SMS guidance reduces avoidable utilization.',
    icon: HeartIcon,
    iconBg: 'bg-amber-200'
  },
  {
    category: 'Employers & Benefit Providers',
    pain: 'Caregiver employees miss more work, leave more often.',
    benefit: 'Simple text support improves retention and productivity.',
    icon: BriefcaseIcon,
    iconBg: 'bg-amber-200'
  },
  {
    category: 'Community-Based Organizations',
    pain: 'Can\'t keep up with growing caregiver support requests.',
    benefit: 'Scale your reach with 24/7 SMS guidance.',
    icon: UsersIcon,
    iconBg: 'bg-amber-200'
  },
  {
    category: 'Long-Term Care & Senior Living',
    pain: 'Anxious families call constantly between visits.',
    benefit: 'Direct text support reduces phone volume.',
    icon: HomeModernIcon,
    iconBg: 'bg-amber-200'
  },
  {
    category: 'Advocacy & Patient Support',
    pain: 'Volunteers can\'t handle 24/7 support demand.',
    benefit: 'SMS handles routine questions, frees volunteers for complex cases.',
    icon: UsersIcon,
    iconBg: 'bg-amber-200'
  },
  {
    category: 'Hospitals & Health Systems',
    pain: 'Caregivers struggle after discharge, driving readmissions.',
    benefit: 'Text-based transition support improves outcomes.',
    icon: BuildingOfficeIcon,
    iconBg: 'bg-amber-200'
  }
];

export default function PartnersPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="section-hero bg-base-100">
          <div className="container-editorial">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="heading-hero mb-6">
                Support that scales<br />with your mission
              </h1>
              <p className="body-large max-w-2xl mx-auto">
                SMS-based caregiver support that integrates seamlessly with your existing services.
              </p>
            </motion.div>
          </div>
        </section>


        {/* Logo Marquee */}
        <LogoMarquee tagline="Trusted by leaders in technology & healthcare" />

        {/* Partners Grid */}
        <section className="section-standard bg-base-100">
          <div className="container-editorial">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-16"
            >
              <h2 className="heading-section mb-4">Who we partner with</h2>
              <p className="body-standard max-w-2xl mx-auto">
                Organizations using GiveCare to support their caregivers
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {partners.map((partner, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                    viewport={{ once: true }}
                    className="card-editorial-lg text-center"
                  >
                    <div className="mb-6 flex justify-center">
                      <div className="text-amber-800">
                        <partner.icon className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className="text-base md:text-lg font-normal text-amber-950 mb-3 tracking-wide">{partner.category}</h3>
                    <p className="text-sm text-amber-800 mb-3 leading-relaxed font-light">{partner.pain}</p>
                    <p className="text-sm text-amber-700 leading-relaxed font-light">{partner.benefit}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* Premier Partner CTA */}
        <section className="section-standard bg-amber-950">
          <div className="container-editorial">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="heading-section-dark mb-4">Become a partner</h2>
              <p className="text-lg text-amber-100 mb-8 max-w-2xl mx-auto font-light leading-relaxed">
                Join our early-adopter program and see measurable improvements in caregiver well-being across your population.
              </p>
              <a
                href="mailto:partners@givecareapp.com"
                className="btn-editorial-secondary"
              >
                Request a Pilot
              </a>
            </motion.div>
          </div>
        </section>
    </>
  );
}
