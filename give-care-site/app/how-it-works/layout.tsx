import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - AI-Powered SMS Caregiver Support | GiveCare',
  description: 'See how GiveCare provides personalized caregiver support through simple text messages. Clinical assessments, wellness tracking, and resources matched to your needs.',
  openGraph: {
    title: 'How GiveCare Works - SMS Support for Caregivers',
    description: 'Text-based caregiver support with clinical assessments, wellness tracking, and personalized resources. No app required.',
    type: 'website',
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
