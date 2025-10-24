import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners - Caregiver Support for Health Plans & Employers | GiveCare',
  description: 'Partner with GiveCare to provide SMS-based caregiver support at scale. Reduce readmissions, improve employee retention, and support millions of family caregivers.',
  openGraph: {
    title: 'Partner with GiveCare - Scale Caregiver Support',
    description: 'SMS-based caregiver support for health plans, employers, and community organizations. Reduce costs and improve outcomes.',
    type: 'website',
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}