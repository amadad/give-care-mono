import './globals.css';
import type { Metadata } from 'next';
import { Alegreya, Gabarito } from 'next/font/google';

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const gabarito = Gabarito({
  subsets: ['latin'],
  variable: '--font-gabarito',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Give Care Story: Empathy Engineered',
  description: 'Give Care Story',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload the video to prevent flashing between slides */}
        <link rel="preload" as="video" href="/crow.mp4" type="video/mp4" />
      </head>
      <body className={`bg-[#54340E] ${alegreya.variable} ${gabarito.variable}`}>
        {/* Global video element that will be used by all slides */}
        <div id="global-video" className="fixed inset-0 -z-10 opacity-0 pointer-events-none">
          <video
            id="bg-video"
            autoPlay
            loop
            muted
            playsInline
            className="h-screen w-screen object-cover"
            src="/crow.mp4"
          />
        </div>
        {children}
      </body>
    </html>
  );
}
