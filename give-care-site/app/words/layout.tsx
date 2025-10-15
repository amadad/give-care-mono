import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Words - GiveCare',
  description: 'Words of wisdom and shared experiences from the caregiving community. Find support, insights, and guidance.'
};

export default function WordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}