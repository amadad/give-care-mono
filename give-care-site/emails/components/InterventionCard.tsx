import { Section, Text, Heading } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing, emailLayout } from '../tokens';
import CTAButton from './CTAButton';

interface InterventionCardProps {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  effectivenessRating?: number; // 0-10
}

export default function InterventionCard({
  title,
  description,
  ctaText,
  ctaHref,
  effectivenessRating,
}: InterventionCardProps) {
  const stars = effectivenessRating
    ? '★'.repeat(Math.round(effectivenessRating / 2)) + '☆'.repeat(5 - Math.round(effectivenessRating / 2))
    : null;

  return (
    <Section style={cardStyle}>
      <Heading style={titleStyle}>{title}</Heading>
      {stars && (
        <Text style={ratingStyle}>
          {stars} <span style={ratingTextStyle}>Evidence-based</span>
        </Text>
      )}
      <Text style={descriptionStyle}>{description}</Text>
      <CTAButton text={ctaText} href={ctaHref} variant="primary" />
    </Section>
  );
}

const cardStyle = {
  ...emailLayout.card,
  backgroundColor: emailColors.background.card,
  marginBottom: emailSpacing.block,
};

const titleStyle = {
  ...emailTypography.heading.card,
  color: emailColors.text.primary,
  margin: '0 0 8px 0',
};

const ratingStyle = {
  fontSize: '14px',
  color: emailColors.accent.amber,
  margin: '0 0 12px 0',
};

const ratingTextStyle = {
  ...emailTypography.label,
  color: emailColors.text.muted,
  marginLeft: '8px',
};

const descriptionStyle = {
  ...emailTypography.body.medium,
  color: emailColors.text.secondary,
  margin: `0 0 ${emailSpacing.card} 0`,
};
