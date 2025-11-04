import { Section, Text, Link, Hr } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing } from '../tokens';

interface EmailFooterProps {
  unsubscribeUrl?: string;
}

export default function EmailFooter({
  unsubscribeUrl = 'https://givecareapp.com/unsubscribe',
}: EmailFooterProps) {
  return (
    <>
      <Hr style={dividerStyle} />
      <Section style={sectionStyle}>
        <Text style={textStyle}>
          GiveCare • Evidence-based caregiver support
        </Text>
        <Text style={textStyle}>
          <Link href={unsubscribeUrl} style={linkStyle}>
            Unsubscribe
          </Link>
          {' • '}
          <Link href="https://givecareapp.com/privacy" style={linkStyle}>
            Privacy
          </Link>
        </Text>
        <Text style={attributionStyle}>
          Based on research from Erlangen University Hospital
        </Text>
      </Section>
    </>
  );
}

const dividerStyle = {
  borderColor: emailColors.border.light,
  margin: `${emailSpacing.section} 0 ${emailSpacing.block} 0`,
};

const sectionStyle = {
  paddingBottom: emailSpacing.block,
  textAlign: 'center' as const,
};

const textStyle = {
  ...emailTypography.body.small,
  color: emailColors.text.muted,
  margin: `${emailSpacing.tight} 0`,
};

const linkStyle = {
  color: emailColors.text.secondary,
  textDecoration: 'none',
};

const attributionStyle = {
  ...emailTypography.body.small,
  color: emailColors.text.accent,
  margin: `${emailSpacing.inline} 0 0 0`,
  fontSize: '12px',
};
