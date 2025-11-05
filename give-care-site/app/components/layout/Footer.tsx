import Link from "next/link";
import Image from "next/image";
import { FaXTwitter, FaLinkedin, FaFacebook, FaInstagram, FaGithub } from "react-icons/fa6";

const socialLinks = [
  {
    href: "https://x.com/givecareapp",
    label: "X (Twitter)",
    icon: <FaXTwitter size={28} />
  },
  {
    href: "https://www.linkedin.com/company/givecareapp/",
    label: "LinkedIn",
    icon: <FaLinkedin size={28} />
  },
  {
    href: "https://www.facebook.com/mygivecare",
    label: "Facebook",
    icon: <FaFacebook size={28} />
  },
  {
    href: "https://www.instagram.com/mygivecare/",
    label: "Instagram",
    icon: <FaInstagram size={28} />
  },
  {
    href: "https://github.com/givecareapp",
    label: "GitHub",
    icon: <FaGithub size={28} />
  }
];

export default function Footer() {
  return (
    <footer className="footer sm:footer-horizontal bg-base-200 text-base-content p-10 gap-8">
      <aside className="min-w-[200px]">
        <Image 
          src="/gc.svg" 
          alt="GiveCare Logo" 
          className="h-12 w-auto" 
          width={120}
          height={40}
        />
        <p className="mt-2">
          Support for care partners and families
          <br />
          © 2025 GiveCare. All rights reserved.
        </p>
        <div className="flex gap-4 mt-4">
          {socialLinks.map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="text-primary hover:text-brown-800 transition-colors w-8 h-8 flex items-center justify-center"
            >
              {icon}
            </a>
          ))}
        </div>
      </aside>
      <nav className="min-w-[120px]">
        <h6 className="footer-title">Product</h6>
        <Link href="/about" className="link link-hover">About</Link>
        <Link href="/how-it-works" className="link link-hover">How It Works</Link>
        <Link href="/partners" className="link link-hover">Partners</Link>
        <Link href="/press" className="link link-hover">Press</Link>
      </nav>
      <nav className="min-w-[120px]">
        <h6 className="footer-title">Resources</h6>
        <Link href="/words" className="link link-hover">Words</Link>
        <Link href="/assessment" className="link link-hover">Start Assessment</Link>
        <a
          href="https://cal.com/amadad/givecare"
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover"
        >
          Schedule a Call
        </a>
      </nav>
      <nav className="min-w-[120px]">
        <h6 className="footer-title">Legal</h6>
        <Link href="/terms" className="link link-hover">Terms of Service</Link>
        <Link href="/privacy" className="link link-hover">Privacy Policy</Link>
      </nav>
      <nav className="col-span-full mt-4">
        <p className="text-xs text-base-content/60 max-w-2xl">
          <strong>Medical Disclaimer:</strong> The information and assessments provided by GiveCare are for informational and educational purposes only and do not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. If you are experiencing a mental health crisis, please contact the 988 Suicide & Crisis Lifeline by dialing 988, or seek immediate medical attention.
        </p>
      </nav>
    </footer>
  );
}
