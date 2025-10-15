import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export const metadata = {
  title: 'Privacy Policy - GiveCare',
  description: 'Read the Privacy Policy for GiveCare.'
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="prose max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy for GiveCare™</h1>
          <p className="text-base-content/60 mb-8">Last Updated: September 15, 2024</p>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Introduction</strong><br />
              Welcome to GiveCare™ ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our GiveCare™ services (collectively, the "Service").
            </li>
            <li>
              <strong>Information We Collect</strong><br />
              We collect the following types of information:
              <ol className="list-decimal pl-6 mt-2">
                <li>
                  <strong>Information you provide:</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Personal details (e.g., name, email, phone number)</li>
                    <li>Health-related information (e.g., caregiving needs, conditions)</li>
                  </ul>
                </li>
                <li>
                  <strong>Information collected automatically:</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Device information (e.g., IP address, browser type, operating system)</li>
                    <li>Usage statistics (e.g., frequency of use, features accessed)</li>
                  </ul>
                </li>
              </ol>
            </li>
            <li>
              <strong>How We Use Your Information</strong><br />
              We use your information for the following purposes:
              <ul className="list-disc pl-6 mt-2">
                <li>To provide and maintain our Service</li>
                <li>To personalize and improve your experience</li>
                <li>To offer relevant caregiving resources and updates</li>
                <li>To ensure the security and integrity of our Service</li>
                <li>For research and analytics to improve caregiving support</li>
              </ul>
            </li>
            <li>
              <strong>Sharing Your Information</strong><br />
              We do not sell your personal information. We may share your information in the following situations:
              <ul className="list-disc pl-6 mt-2">
                <li>With service providers who assist in operating our Service</li>
                <li>To comply with legal obligations</li>
                <li>With your consent or at your direction</li>
              </ul>
            </li>
            <li>
              <strong>Data Retention</strong><br />
              We retain your personal information for as long as necessary to provide you with our Service and as described in this Privacy Policy. We may retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
            </li>
            <li>
              <strong>Security</strong><br />
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </li>
            <li>
              <strong>Changes to This Privacy Policy</strong><br />
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </li>
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
} 