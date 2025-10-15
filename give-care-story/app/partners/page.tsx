"use client";

import { SlideDeck } from "../../app/components/SlideDeck";
import Slide1 from "./slides/cover";
import Slide6 from "./slides/care-stats-04";
import Slide22 from "./slides/beta";
import Slide35 from "./slides/app-demo";
import Slide37 from "./slides/quote-tracey";
import Slide40 from "./slides/end";
import WhoWePartnerWith from "./slides/who-we-partner-with";
import FounderStory from "./slides/founder-story";
import CaregiverDataTable from "./slides/caregiver-data-table";
import QuoteCare from "./slides/quote-care";
import AppArchitecture from "./slides/app-architecture";
import CareCaregiver from "./slides/care-caregiver";
import FrameworksMethodology from "./slides/frameworks-methodology";
import PartnershipROI from "./slides/partnership-roi";
import WhyPartner from "./slides/why-partner";
import ImplementationTimeline from "./slides/implementation-timeline";

export default function AnnualMeeting() {
  const slides = [
    <Slide1 key={1} />,
    <FounderStory key="founder-story" />,
    <Slide6 key={6} />,
    <QuoteCare key="quote-care" />,
    <CaregiverDataTable key="caregiver-data" />,
    <CareCaregiver key="care-caregiver" />,
    <Slide37 key={37} />,
    <Slide22 key={22} />,
    <PartnershipROI key="partnership-roi" />,
    <Slide35 key={35} />,
    <AppArchitecture key="app-architecture" />,
    <FrameworksMethodology key="frameworks-methodology" />,
    <WhyPartner key="why-partner" />,
    <WhoWePartnerWith key="partners" />,
    <ImplementationTimeline key="implementation-timeline" />,
    <Slide40 key={40} />,
  ];

  return <SlideDeck slides={slides} />;
}