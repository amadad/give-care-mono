import Link from 'next/link'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1 bg-base-100 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-3xl">
          {/* Large 404 */}
          <h1 className="text-7xl sm:text-9xl font-serif font-light text-amber-950 mb-6 leading-none">
            404
          </h1>

          {/* Heading */}
          <h2 className="text-2xl sm:text-4xl font-serif font-light text-amber-900 mb-4">
            This page doesn't exist
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-amber-700 font-light mb-10 max-w-xl mx-auto">
            We couldn't find what you're looking for. But we're here to help you find support.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-amber-950 text-white text-sm tracking-widest hover:bg-amber-900 transition-colors duration-200 rounded-lg"
            >
              Go Home
            </Link>
            <Link
              href="/assessment"
              className="inline-block px-8 py-3 bg-white text-amber-950 text-sm tracking-widest hover:bg-amber-50 transition-colors duration-200 rounded-lg border border-amber-200"
            >
              Start Assessment
            </Link>
          </div>

          {/* Helpful Links */}
          <div className="border-t border-amber-200 pt-8">
            <p className="text-sm text-amber-700 font-light mb-4">
              Looking for something specific?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/how-it-works"
                className="text-sm text-amber-800 hover:text-amber-950 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-sm text-amber-800 hover:text-amber-950 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/words"
                className="text-sm text-amber-800 hover:text-amber-950 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/partners"
                className="text-sm text-amber-800 hover:text-amber-950 underline decoration-amber-300 hover:decoration-amber-500 transition-colors"
              >
                Partners
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
