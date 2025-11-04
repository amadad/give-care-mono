import { Section, Text, Heading } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing, emailLayout } from '../tokens';

interface PressureZoneCardProps {
  zone: {
    name: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
  };
}

export default function PressureZoneCard({ zone }: PressureZoneCardProps) {
  const severityColors = {
    low: emailColors.severity.low,
    moderate: emailColors.severity.moderate,
    high: emailColors.severity.high,
    critical: emailColors.severity.critical,
  };

  const severityLabels = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    critical: 'Critical',
  };

  return (
    <Section style={cardStyle}>
      <Heading style={nameStyle}>{zone.name}</Heading>
      <Text style={{ ...badgeStyle, backgroundColor: severityColors[zone.severity] }}>
        {severityLabels[zone.severity]}
      </Text>
      <Text style={descriptionStyle}>{zone.description}</Text>
    </Section>
  );
}

const cardStyle = {
  ...emailLayout.card,
  backgroundColor: emailColors.background.card,
  marginBottom: emailSpacing.block,
};

const nameStyle = {
  ...emailTypography.heading.card,
  color: emailColors.text.primary,
  margin: '0 0 8px 0',
};

const badgeStyle = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#ffffff',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px 0',
};

const descriptionStyle = {
  ...emailTypography.body.medium,
  color: emailColors.text.secondary,
  margin: '0',
};
