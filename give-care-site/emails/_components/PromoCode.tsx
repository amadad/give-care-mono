import { Section, Text } from '@react-email/components';
import * as React from 'react';

interface PromoCodeProps {
  code: string;
  description: string;
}

export default function PromoCode({ code, description }: PromoCodeProps) {
  return (
    <Section style={promoBox}>
      <Text style={promoTitle}>{description}</Text>
      <div style={codeContainer}>
        <Text style={codeText}>{code}</Text>
      </div>
      <Text style={instruction}>Use this code at checkout</Text>
    </Section>
  );
}

const promoBox = {
  background: '#fef3c7',
  border: '2px dashed #f59e0b',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 auto 20px auto',
  maxWidth: '400px',
  textAlign: 'center' as const,
};

const promoTitle = {
  color: '#78350f',
  margin: '0 0 8px 0',
  fontSize: '16px',
  fontWeight: '600',
};

const codeContainer = {
  background: '#ffffff',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
};

const codeText = {
  color: '#78350f',
  margin: '0',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '2px',
};

const instruction = {
  color: '#92400e',
  margin: '0',
  fontSize: '12px',
};
