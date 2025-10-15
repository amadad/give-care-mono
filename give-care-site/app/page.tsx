import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// MINIMAL REDESIGN SECTIONS
import NewHero from "./components/sections/NewHero";
import LogoMarquee from "./components/LogoMarquee";
import FeaturesBentoGrid from "./components/sections/FeaturesBentoGrid";
import SMSFirstSection from "./components/sections/SMSFirstSection";
import Testimonials from "./components/sections/Testimonials";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <NewHero />
        <FeaturesBentoGrid />
        <SMSFirstSection />
        <LogoMarquee />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}