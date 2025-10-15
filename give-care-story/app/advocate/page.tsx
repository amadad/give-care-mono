"use client";

import { SlideDeck } from "../../app/components/SlideDeck";
import Slide1 from "./slides/cover";
import Slide2 from "./slides/black";
import Slide3 from "./slides/notebook01";
import Slide4 from "./slides/notebook02";
import Slide5 from "./slides/05-video-demo";
import Slide6 from "./slides/care-stats-04";
import Slide7 from "./slides/us-numbers-snapshot";
import Slide8 from "./slides/carespan";
import Slide9 from "./slides/advocacy-gap";
import Slide10 from "./slides/care-caregiver";
import Slide11 from "./slides/article-hbr-01";
import Slide12 from "./slides/ai-ethics";
import Slide13 from "./slides/quote-care";
import Slide14 from "./slides/article-eq";
import Slide15 from "./slides/tweet-slide";
import Slide16 from "./slides/care-stats-02";
import Slide17 from "./slides/workshop-insights";
import Slide18 from "./slides/workshop-opportunities";
import Slide19 from "./slides/news-headlines";
import Slide20 from "./slides/ai-dangers";
import Slide21 from "./slides/ai-agentic-risks";
import Slide22 from "./slides/beta";
import Slide23 from "./slides/ai-today";
import Slide24 from "./slides/core-principles";
import Slide25 from "./slides/ai-horizon";
import Slide26 from "./slides/app-architecture";
import Slide27 from "./slides/app-safety";
import Slide28 from "./slides/app-tools";
import Slide29 from "./slides/app-memory";
import Slide30 from "./slides/ai-partnership";
import Slide31 from "./slides/app-onboarding";
import Slide32 from "./slides/app-triage";
import Slide33 from "./slides/app-profile-extraction";
import Slide34 from "./slides/app-knowledge";
import Slide35 from "./slides/app-demo";
import Slide36 from "./slides/app-micro";
import Slide37 from "./slides/quote-tracey";
import Slide38 from "./slides/apha-offer";
import Slide39 from "./slides/advocate-integration";
import Slide40 from "./slides/end";

export default function AnnualMeeting() {
  const slides = [
    <Slide1 key={1} />,
    <Slide2 key={2} />,
    <Slide3 key={3} />,
    <Slide4 key={4} />,
    <Slide5 key={5} />,
    <Slide6 key={6} />,
    <Slide7 key={7} />,
    <Slide8 key={8} />,
    <Slide9 key={9} />,
    <Slide10 key={10} />,
    <Slide11 key={11} />,
    <Slide12 key={12} />,
    <Slide13 key={13} />,
    <Slide14 key={14} />,
    <Slide15 key={15} />,
    <Slide16 key={16} />,
    <Slide17 key={17} />,
    <Slide18 key={18} />,
    <Slide19 key={19} />,
    <Slide20 key={20} />,
    <Slide21 key={21} />,
    <Slide22 key={22} />,
    <Slide23 key={23} />,
    <Slide24 key={24} />,
    <Slide25 key={25} />,
    <Slide26 key={26} />,
    <Slide27 key={27} />,
    <Slide28 key={28} />,
    <Slide29 key={29} />,
    <Slide30 key={30} />,
    <Slide31 key={31} />,
    <Slide32 key={32} />,
    <Slide33 key={33} />,
    <Slide34 key={34} />,
    <Slide35 key={35} />,
    <Slide36 key={36} />,
    <Slide37 key={37} />,
    <Slide38 key={38} />,
    <Slide39 key={39} />,
    <Slide40 key={40} />,
  ];

  return <SlideDeck slides={slides} />;
}
