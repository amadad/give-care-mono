import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PressureZone {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
}

interface AssessmentResultsProps {
  email: string;
  score: number;
  band: 'Mild' | 'Moderate' | 'Severe';
  interpretation: string;
  pressureZones?: PressureZone[];
}

export default function AssessmentResults({
  email,
  score,
  band,
  interpretation,
  pressureZones = [],
}: AssessmentResultsProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Assessment Results: {band} Burden ({String(score)}/30)</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://www.givecareapp.com/gc-logo.png"
              width="200"
              height="30"
              alt="GiveCare"
              style={logo}
            />
          </Section>

          <Section style={scoreSection}>
            <Heading style={scoreHeading}>{String(score)}<span style={scoreTotal}> / 30</span></Heading>
            <Text style={bandText}>{band} Burden</Text>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={bodyText}>
              What you're feeling is real—and now it's measured. This clinically validated assessment gives you language for what you're experiencing.
            </Text>
          </Section>

          <Section style={contentSection}>
            <Text style={bodyText}>{interpretation}</Text>
          </Section>

          <Section style={contentSection}>
            <Text style={bodyText}>
              Caregiving is hard. You're not alone in this, and you deserve support.
            </Text>
          </Section>

          {pressureZones.length > 0 && (
            <Section style={contentSection}>
              <Heading style={subheading}>Key Areas</Heading>
              {pressureZones.map((zone, index) => (
                <Section key={index} style={zoneItem}>
                  <Text style={zoneName}>{zone.name}</Text>
                  <Text style={zoneDesc}>{zone.description}</Text>
                </Section>
              ))}
            </Section>
          )}

          <Section style={contentSection}>
            <Text style={bodyText}>
              GiveCare uses clinical assessments over SMS to measure your burnout. Evidence-based interventions lower it. Progress tracking proves it.
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Button href="https://givecareapp.com" style={ctaButton}>
              Explore Support
            </Button>
            <Text style={promoText}>Use code BSFC20 for 20% off</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              GiveCare • <a href="mailto:hello@my.givecareapp.com?subject=Unsubscribe" style={link}>Unsubscribe</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles - Clean & Minimal
const main = {
  backgroundColor: '#FFE8D6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '20px auto',
  maxWidth: '560px',
  padding: '0 24px',
  backgroundColor: '#FFE8D6',
};

const logoSection = {
  padding: '16px 0 8px 0',
};

const logo = {
  display: 'block',
};

const scoreSection = {
  padding: '16px 0 16px 0',
};

const scoreHeading = {
  margin: '0',
  fontSize: '56px',
  fontWeight: '300' as const,
  color: '#54340E',
  lineHeight: '1',
  letterSpacing: '-0.04em',
};

const scoreTotal = {
  fontSize: '32px',
  color: '#c4915a',
  fontWeight: '300' as const,
};

const bandText = {
  margin: '12px 0 0 0',
  fontSize: '16px',
  color: '#92400e',
  fontWeight: '400' as const,
};

const divider = {
  borderColor: '#f5e6d3',
  margin: '24px 0',
  borderTop: '1px solid #f5e6d3',
};

const contentSection = {
  padding: '0 0 20px 0',
};

const bodyText = {
  margin: '0',
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#78350f',
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const subheading = {
  margin: '0 0 16px 0',
  fontSize: '14px',
  fontWeight: '500' as const,
  color: '#54340E',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const zoneItem = {
  padding: '0 0 12px 0',
};

const zoneName = {
  margin: '0 0 4px 0',
  fontSize: '15px',
  fontWeight: '500' as const,
  color: '#54340E',
};

const zoneDesc = {
  margin: '0',
  fontSize: '14px',
  color: '#92400e',
  lineHeight: '1.5',
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const ctaSection = {
  padding: '16px 0 24px 0',
  textAlign: 'center' as const,
};

const ctaButton = {
  backgroundColor: '#54340E',
  color: '#ffffff',
  padding: '12px 28px',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: '500' as const,
  fontSize: '15px',
  display: 'inline-block',
};

const promoText = {
  margin: '12px 0 0 0',
  fontSize: '13px',
  color: '#92400e',
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const footer = {
  padding: '20px 0 16px 0',
  textAlign: 'center' as const,
  borderTop: '1px solid #f5e6d3',
};

const footerText = {
  margin: '0 0 8px 0',
  fontSize: '12px',
  color: '#c4915a',
  lineHeight: '1.5',
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const link = {
  color: '#92400e',
  textDecoration: 'none',
};
