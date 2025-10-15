import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners - GiveCare',
  description: 'Join our network of partners dedicated to supporting caregivers and improving care experiences.'
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}