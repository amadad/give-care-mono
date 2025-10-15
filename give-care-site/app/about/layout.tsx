import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - GiveCare',
  description: 'The SMS-first AI companion built by caregivers, for caregivers. Learn how GiveCare transforms fragmented knowledge into timely, personalized action.'
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}