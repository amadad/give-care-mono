'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PressRelease {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  slug: string;
}

const pressReleases: PressRelease[] = [
  {
    id: '1',
    title: 'GiveCare Releases First Open-Source AI Safety Framework for Family Caregivers with New Evaluation Benchmarks',
    date: 'November 4, 2025',
    excerpt: 'GiveCare releases two foundational preprints ahead of AgeTech Connect Summit and Caregiver Action Network Hill Day during National Family Caregivers Month.',
    slug: 'givecare-launches-november-2025'
  }
];

export default function PressPage() {
  return (
    <section className="section-standard bg-base-100">
      <div className="container-editorial">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="heading-hero text-center mb-6">Press</h1>
          <p className="body-large text-center mb-12">
            News and announcements from GiveCare
          </p>

          <div className="space-y-8">
            {pressReleases.map((release) => (
              <motion.article
                key={release.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="border-b border-amber-200 pb-8 last:border-b-0"
              >
                <time className="text-sm text-amber-700 mb-2 block">
                  {release.date}
                </time>
                <h2 className="text-2xl font-bold text-amber-950 mb-3">
                  <Link
                    href={`/press/${release.slug}`}
                    className="hover:text-amber-700 transition-colors"
                  >
                    {release.title}
                  </Link>
                </h2>
                <p className="body-standard mb-4">
                  {release.excerpt}
                </p>
                <Link
                  href={`/press/${release.slug}`}
                  className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
                >
                  Read full release →
                </Link>
              </motion.article>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-amber-200">
            <h3 className="text-lg font-bold text-amber-950 mb-4">Media Contact</h3>
            <p className="body-standard">
              For press inquiries, please contact:{' '}
              <a
                href="mailto:press@givecareapp.com"
                className="text-amber-700 hover:text-amber-900 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                press@givecareapp.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
