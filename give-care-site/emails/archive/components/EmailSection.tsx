import { Section } from '@react-email/components';
import * as React from 'react';
import { emailSpacing } from '../tokens';

interface EmailSectionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export default function EmailSection({ children, style }: EmailSectionProps) {
  return (
    <Section style={{ padding: `${emailSpacing.block} 0`, ...style }}>
      {children}
    </Section>
  );
}
