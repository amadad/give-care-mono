import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing } from '../tokens';

interface TipCalloutProps {
  tip: string;
  icon?: string;
}

export default function TipCallout({ tip, icon = '💡' }: TipCalloutProps) {
  return (
    <Section style={calloutStyle}>
      <Text style={iconStyle}>{icon}</Text>
      <Text style={tipStyle}>{tip}</Text>
    </Section>
  );
}

const calloutStyle = {
  padding: '16px',
  backgroundColor: emailColors.background.muted,
  borderRadius: '8px',
  borderLeft: `3px solid ${emailColors.accent.info}`,
  marginBottom: emailSpacing.block,
};

const iconStyle = {
  fontSize: '20px',
  margin: '0 0 8px 0',
};

const tipStyle = {
  ...emailTypography.body.medium,
  color: emailColors.text.primary,
  margin: '0',
};
