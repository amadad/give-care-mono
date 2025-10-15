import { Section, Heading } from '@react-email/components';
import * as React from 'react';

interface EmailHeaderProps {
  title: string;
}

export default function EmailHeader({ title }: EmailHeaderProps) {
  return (
    <Section style={header}>
      <Heading style={h1}>{title}</Heading>
      <div style={subtitle}>BSFC Assessment Report</div>
    </Section>
  );
}

const header = {
  background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  margin: '0 0 8px 0',
  fontSize: '28px',
  fontWeight: '600',
};

const subtitle = {
  color: '#fef3c7',
  margin: '0',
  fontSize: '16px',
};
