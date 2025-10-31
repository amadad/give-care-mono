import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing } from '../tokens';

interface ValidationBlockProps {
  message: string;
  tone?: 'compassionate' | 'encouraging' | 'urgent' | 'neutral';
}

/**
 * P1-compliant validation message (Acknowledge > Answer > Advance)
 * Trauma-informed language that validates caregiver burden
 */
export default function ValidationBlock({
  message,
  tone = 'compassionate',
}: ValidationBlockProps) {
  const iconMap = {
    compassionate: '💙',
    encouraging: '✨',
    urgent: '⚠️',
    neutral: 'ℹ️',
  };

  return (
    <Section style={sectionStyle}>
      <Text style={iconStyle}>{iconMap[tone]}</Text>
      <Text style={messageStyle}>{message}</Text>
    </Section>
  );
}

const sectionStyle = {
  padding: '20px',
  backgroundColor: emailColors.background.muted,
  borderRadius: '12px',
  borderLeft: `4px solid ${emailColors.accent.amber}`,
  marginBottom: emailSpacing.block,
};

const iconStyle = {
  fontSize: '24px',
  margin: '0 0 8px 0',
};

const messageStyle = {
  ...emailTypography.body.large,
  color: emailColors.text.primary,
  margin: '0',
};
