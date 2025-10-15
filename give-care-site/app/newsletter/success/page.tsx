import { Metadata } from "next";
import Navbar from "@/app/components/layout/Navbar";
import SimpleHero from "@/app/components/sections/SimpleHero";
import Footer from "@/app/components/layout/Footer";

export const metadata: Metadata = {
  title: "Thank You for Subscribing | GiveCare",
  description: "You've successfully subscribed to the GiveCare newsletter. Stay tuned for updates and insights.",
};

export default function NewsletterSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center w-full">
        <SimpleHero
          title="Welcome to the GiveCare Community!"
          description="Thank you for subscribing to our newsletter. You'll receive our latest updates, caregiving tips, and exclusive insights directly in your inbox."
          showCTA={true}
          ctaText="Return to Homepage"
          ctaHref="/"
          variant="success"
        />
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <div className="bg-success/10 border border-success/20 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-success mb-4">What's Next?</h2>
            <ul className="text-left space-y-3 text-base-content/80">
              <li className="flex items-start">
                <span className="text-success mr-2">✓</span>
                <span>Check your email for a confirmation message</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-2">✓</span>
                <span>Add hello@givecare.com to your contacts to ensure delivery</span>
              </li>
              <li className="flex items-start">
                <span className="text-success mr-2">✓</span>
                <span>Expect your first newsletter within the next week</span>
              </li>
            </ul>
          </div>
          <p className="text-base-content/70">
            Have questions? Reach out to us at{" "}
            <a href="mailto:hello@givecare.com" className="link link-primary">
              hello@givecare.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}