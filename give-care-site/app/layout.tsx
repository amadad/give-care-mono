import type { Metadata } from "next";
import { Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};
import { Gabarito, Alegreya } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import ErrorBoundary from "./components/ErrorBoundary";
import { ConvexClientProvider } from "./providers/ConvexClientProvider";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

const gabarito = Gabarito({
  weight: ['500', '600', '700', '800'],
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-gabarito',
});

const alegreya = Alegreya({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  variable: '--font-alegreya',
});

export const metadata: Metadata = {
  title: {
    default: "GiveCare - Personalized Caregiver Support",
    template: "%s | GiveCare"
  },
  description: "GiveCare provides personalized guidance, emotional support, and practical resources for caregivers - all through simple text messages.",
  keywords: ["caregiving", "caregiver support", "elder care", "healthcare", "SMS support", "caregiver resources"],
  authors: [{ name: "GiveCare Team" }],
  creator: "GiveCare",
  publisher: "GiveCare",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://givecareapp.com",
    siteName: "GiveCare",
    title: "GiveCare - Personalized Caregiver Support",
    description: "Personalized guidance, emotional support, and practical resources for caregivers - all through simple text messages.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "GiveCare - Personalized Caregiver Support"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GiveCare - Personalized Caregiver Support",
    description: "Personalized guidance, emotional support, and practical resources for caregivers - all through simple text messages.",
    images: ["/og.png"]
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico"
  },
  metadataBase: new URL("https://givecareapp.com"),
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': "large",
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://givecareapp.com",
    languages: {
      "en": "https://givecareapp.com"
    }
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="overflow-y-scroll" data-theme="givecare">
      <head>
        <meta name="google-site-verification" content="Pf2VKTccBz7pVbaO23c0-6V0u5hil_kSzNPS1lJHz3g" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="canonical" href="https://givecareapp.com" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Analytics - only in production */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
              async
              defer
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                  transport_type: 'beacon',
                  anonymize_ip: true
                });
              `}
            </Script>
          </>
        )}
        {/* Hotjar - only in production */}
        {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <Script id="hotjar" strategy="lazyOnload">
            {`
              (function(h,o,t,j,a,r){
                h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                a=o.getElementsByTagName('head')[0];
                r=o.createElement('script');r.async=1;
                r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `}
          </Script>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GiveCare",
              "url": "https://givecareapp.com",
              "logo": "https://givecareapp.com/logo-2.svg",
              "description": "GiveCare provides personalized guidance, emotional support, and practical resources for caregivers - all through simple text messages.",
              "sameAs": [
                "https://x.com/givecareapp",
                "https://www.instagram.com/mygivecare/",
                "https://facebook.com/givecareapp"
              ]
            })
          }}
        />
      </head>
      <body className={`${gabarito.variable} ${alegreya.variable} font-sans min-h-screen bg-base-100 text-base-content flex flex-col w-full`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-content focus:rounded">
          Skip to main content
        </a>
        <style dangerouslySetInnerHTML={{
          __html: `:root{--font-sans:var(--font-gabarito);--font-serif:var(--font-alegreya);}h1,h2,h3,h4,h5,h6{font-family:var(--font-alegreya),serif;}`
        }} />
        <ConvexClientProvider>
          <ErrorBoundary>
            <div className="min-h-screen flex flex-col bg-base-100">
              <Navbar />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ErrorBoundary>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
