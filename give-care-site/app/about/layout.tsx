import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Built by Caregivers, for Caregivers | GiveCare',
  description: 'The SMS-first AI companion built by caregivers, for caregivers. Learn how GiveCare transforms fragmented knowledge into timely, personalized action for 63 million American family caregivers.',
  openGraph: {
    title: 'About GiveCare - Our Mission to Support Family Caregivers',
    description: 'Built by caregivers who understand the journey. Supporting family caregivers with AI-powered text message support.',
    type: 'website',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}