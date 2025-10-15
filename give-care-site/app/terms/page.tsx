import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service - GiveCare',
  description: 'Read the Terms of Service for GiveCare.'
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="prose max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Terms of Service for GiveCare™</h1>
          <p className="text-base-content/60 mb-8">Last Updated: September 15, 2024</p>
          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Acceptance of Terms</strong><br />
              By accessing or using the GiveCare™ service (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
            </li>
            <li>
              <strong>Description of Service</strong><br />
              GiveCare™ is a service designed to provide personalized support and resources for caregivers. The Service may be modified, updated, or changed at any time without notice.
            </li>
            <li>
              <strong>User Accounts</strong>
              <ol className="list-decimal pl-6 mt-2">
                <li>You may be required to create an account to access certain features of the Service. You are responsible for maintaining the confidentiality of your account credentials and all activities that occur under your account.</li>
                <li>You agree to provide accurate, current, and complete information during the registration process and to update such information to ensure it remains accurate and current.</li>
              </ol>
            </li>
            <li>
              <strong>User Conduct</strong><br />
              You agree not to:
              <ul className="list-disc pl-6 mt-2">
                <li>Use the Service for any unlawful purposes or in violation of applicable laws or regulations.</li>
                <li>Violate or encourage others to violate the rights of third parties, including intellectual property rights.</li>
                <li>Attempt to gain unauthorized access to the Service, its systems, or related networks.</li>
                <li>Use automated tools or scripts to collect data or interact with the Service.</li>
                <li>Misrepresent yourself, or falsely associate with any person or entity.</li>
              </ul>
            </li>
            <li>
              <strong>Intellectual Property</strong>
              <ol className="list-decimal pl-6 mt-2">
                <li>The Service, including all content, features, and functionality, is owned by GiveCare™ and is protected by copyright, trademark, and other intellectual property laws.</li>
                <li>Any materials, content, or resources provided by the Service are intended for your personal use. However, we do not guarantee that they are free from third-party claims or available for unrestricted use.</li>
              </ol>
            </li>
            <li>
              <strong>Disclaimer of Warranties</strong><br />
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </li>
            <li>
              <strong>Limitation of Liability</strong><br />
              IN NO EVENT SHALL GIVECARE™, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OR INABILITY TO USE THE SERVICE.
            </li>
            <li>
              <strong>Indemnification</strong><br />
              You agree to indemnify and hold harmless GiveCare™ and its officers, directors, employees, and agents from any claims, liabilities, or damages arising from your use of the Service.
            </li>
            <li>
              <strong>Termination</strong><br />
              We reserve the right to terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for any reason, including breach of these Terms.
            </li>
            <li>
              <strong>Changes to Terms</strong><br />
              GiveCare™ reserves the right to modify or update these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last Updated" date.
            </li>
            <li>
              <strong>Governing Law</strong><br />
              These Terms shall be governed and construed in accordance with the laws of the State of New York, without regard to its conflict of law principles.
            </li>
          </ol>
        </div>
      </main>
      <Footer />
    </div>
  );
} 