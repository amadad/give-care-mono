import './globals.css';
import type { Metadata } from 'next';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&family=Gabarito:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="video" href="/crow.mp4" type="video/mp4" />
      </head>
      <body className="bg-[#54340E]">
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
