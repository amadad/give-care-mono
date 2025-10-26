// MINIMAL REDESIGN SECTIONS
import NewHero from "./components/sections/NewHero";
import LogoMarquee from "./components/LogoMarquee";
import FeaturesBentoGrid from "./components/sections/FeaturesBentoGrid";
import SMSFirstSection from "./components/sections/SMSFirstSection";
import Testimonials from "./components/sections/Testimonials";

export default function Home() {
  return (
    <>
      <NewHero />
      <FeaturesBentoGrid />
      <SMSFirstSection />
      <LogoMarquee />
      <Testimonials />
    </>
  );
}