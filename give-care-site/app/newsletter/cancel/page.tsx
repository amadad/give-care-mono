import { Metadata } from "next";
import Link from "next/link";
import SimpleHero from "@/app/components/sections/SimpleHero";

export const metadata: Metadata = {
  title: "Subscription Cancelled | GiveCare",
  description: "Your newsletter subscription process was cancelled. You can subscribe anytime when you're ready.",
};

export default function NewsletterCancelPage() {
  return (
    <>
      <div className="flex flex-col items-center w-full">
        <SimpleHero
          title="Subscription Cancelled"
          description="No worries! You haven't been subscribed to our newsletter. Feel free to explore our site and subscribe whenever you're ready."
          showCTA={true}
          ctaText="Return to Homepage"
          ctaHref="/"
          variant="cancel"
        />
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-light text-warning mb-4">Changed Your Mind?</h2>
            <p className="text-base-content/80 mb-6">
              You can still join our community and receive valuable caregiving insights and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#newsletter" className="btn-editorial-primary">
                Subscribe to Newsletter
              </Link>
              <Link href="/about" className="btn-editorial-secondary">
                Learn More About GiveCare
              </Link>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <h3 className="font-light text-lg mb-2">Explore Resources</h3>
              <p className="text-base-content/70 text-sm">
                Check out our <Link href="/news" className="link link-primary">latest articles</Link> on caregiving
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-light text-lg mb-2">Follow Us</h3>
              <p className="text-base-content/70 text-sm">
                Stay connected on <a href="https://x.com/givecareapp" target="_blank" rel="noopener noreferrer" className="link link-primary">social media</a>
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-light text-lg mb-2">Get in Touch</h3>
              <p className="text-base-content/70 text-sm">
                Email us at <a href="mailto:hello@givecare.com" className="link link-primary">hello@givecare.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
