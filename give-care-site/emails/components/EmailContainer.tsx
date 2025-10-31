import { Container } from '@react-email/components';
import * as React from 'react';
import { emailLayout, emailColors } from '../tokens';

interface EmailContainerProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Centered content container
 * Max width 600px for optimal email client rendering
 */
export default function EmailContainer({ children, style }: EmailContainerProps) {
  return (
    <Container style={{ ...containerStyle, ...style }}>
      {children}
    </Container>
  );
}

const containerStyle = {
  maxWidth: emailLayout.container.maxWidth,
  margin: emailLayout.container.margin,
  padding: emailLayout.container.padding,
  backgroundColor: emailColors.background.primary,
};
