import { Html, Head, Preview, Body, Font } from '@react-email/components';
import * as React from 'react';
import { emailColors, emailCompat } from '../tokens';

interface EmailShellProps {
  previewText: string;
  children: React.ReactNode;
}

/**
 * Base email wrapper with head, fonts, and body
 * Use this as the outermost wrapper for all emails
 */
export default function EmailShell({ previewText, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Georgia"
          fallbackFontFamily="Times New Roman"
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Georgia&display=swap',
            format: 'woff2',
          }}
        />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>{children}</Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: emailColors.background.primary,
  fontFamily: emailCompat.fontStack.serif,
  margin: '0',
  padding: '0',
  width: '100%',
};
