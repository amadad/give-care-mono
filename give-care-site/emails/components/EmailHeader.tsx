import { Section, Img, Heading } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing } from '../tokens';

interface EmailHeaderProps {
  title?: string;
  logoUrl?: string;
}

export default function EmailHeader({
  title,
  logoUrl = 'https://www.givecareapp.com/gc-logo.png',
}: EmailHeaderProps) {
  return (
    <Section style={sectionStyle}>
      <Img
        src={logoUrl}
        width="180"
        height="27"
        alt="GiveCare"
        style={logoStyle}
      />
      {title && <Heading style={titleStyle}>{title}</Heading>}
    </Section>
  );
}

const sectionStyle = {
  paddingTop: emailSpacing.section,
  paddingBottom: emailSpacing.block,
};

const logoStyle = {
  display: 'block',
  marginBottom: emailSpacing.inline,
};

const titleStyle = {
  ...emailTypography.heading.hero,
  color: emailColors.text.primary,
  margin: `${emailSpacing.inline} 0 0 0`,
};
