import { Section, Text, Link } from '@react-email/components';
import * as React from 'react';

export default function EmailFooter() {
  return (
    <Section style={footer}>
      <Text style={attribution}>
        <strong>Based on the BSFC</strong> (Burden Scale for Family Caregivers) — a clinically validated
        tool developed by Erlangen University Hospital and used across Europe in 20 languages.
      </Text>
      <Text style={links}>
        <Link href="https://givecareapp.com" style={link}>GiveCare</Link>
        {' · '}
        <Link href="https://givecareapp.com/words" style={link}>Resources</Link>
        {' · '}
        <Link href="#" style={link}>Unsubscribe</Link>
      </Text>
    </Section>
  );
}

const footer = {
  padding: '24px',
  backgroundColor: '#fef3c7',
  textAlign: 'center' as const,
  fontSize: '12px',
  color: '#78350f',
};

const attribution = {
  margin: '0 0 16px 0',
  color: '#92400e',
  lineHeight: '1.6',
};

const links = {
  margin: '0',
  color: '#92400e',
};

const link = {
  color: '#78350f',
  textDecoration: 'none',
};
