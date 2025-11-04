import { Section, Text, Row, Column } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailTypography, emailSpacing, emailLayout } from '../tokens';

interface ScoreCardProps {
  score: number; // 0-30
  band: 'Mild' | 'Moderate' | 'Severe';
  showTrend?: boolean;
  previousScore?: number;
}

export default function ScoreCard({
  score,
  band,
  showTrend = false,
  previousScore,
}: ScoreCardProps) {
  const bandColors = {
    Mild: emailColors.severity.low,
    Moderate: emailColors.severity.moderate,
    Severe: emailColors.severity.high,
  };

  const trendArrow = previousScore
    ? score > previousScore
      ? '↑'
      : score < previousScore
      ? '↓'
      : '→'
    : null;

  return (
    <Section style={cardStyle}>
      <Row>
        <Column align="center">
          <Text style={scoreStyle}>
            {score}
            <span style={totalStyle}>/30</span>
          </Text>
          <Text style={{ ...bandStyle, color: bandColors[band] }}>
            {band} Burden
          </Text>
          {showTrend && trendArrow && previousScore && (
            <Text style={trendStyle}>
              {trendArrow} from {previousScore}
            </Text>
          )}
        </Column>
      </Row>
    </Section>
  );
}

const cardStyle = {
  ...emailLayout.card,
  backgroundColor: emailColors.background.card,
  marginBottom: emailSpacing.block,
  textAlign: 'center' as const,
};

const scoreStyle = {
  fontSize: '56px',
  fontWeight: '300' as const,
  color: emailColors.text.primary,
  lineHeight: '1',
  letterSpacing: '-0.04em',
  margin: '0',
};

const totalStyle = {
  fontSize: '32px',
  color: emailColors.text.accent,
  fontWeight: '300' as const,
};

const bandStyle = {
  ...emailTypography.heading.card,
  margin: `${emailSpacing.inline} 0 0 0`,
};

const trendStyle = {
  ...emailTypography.body.small,
  color: emailColors.text.muted,
  margin: `${emailSpacing.tight} 0 0 0`,
};
