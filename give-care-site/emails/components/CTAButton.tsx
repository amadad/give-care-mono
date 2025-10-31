import { Button } from '@react-email/components';
import * as React from 'react';
import { emailButton } from '../tokens';

interface CTAButtonProps {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export default function CTAButton({
  text,
  href,
  variant = 'primary',
}: CTAButtonProps) {
  const style = variant === 'primary' ? emailButton.primary : emailButton.secondary;

  return (
    <Button href={href} style={style}>
      {text}
    </Button>
  );
}
