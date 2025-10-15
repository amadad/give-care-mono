"use client";

import { SlideDeck } from "../../app/components/SlideDeck";
import Slide1 from "./slides/cover";
import Slide2 from "./slides/black";
import Slide3 from "./slides/notebook01";
import Slide4 from "./slides/notebook02";
import Slide5 from "./slides/care-stats-04";
import Slide6 from "./slides/article-hbr-01";
import Slide7 from "./slides/care-caregiver";
import Slide8 from "./slides/quote-care";
import Slide9 from "./slides/article-eq";
import Slide10 from "./slides/care-stats-02";
import Slide11 from "./slides/beta";
import Slide12 from "./slides/app-safety";
import Slide13 from "./slides/app-tools";
import Slide14 from "./slides/app-memory";
import Slide15 from "./slides/app-onboarding";
import Slide17 from "./slides/app-demo";
import Slide18 from "./slides/app-triage";
import Slide19 from "./slides/app-micro";
import Slide20 from "./slides/end";

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
    <Slide17 key={17} />,
    <Slide18 key={18} />,
    <Slide19 key={19} />,
    <Slide20 key={20} />,
  ];

  return <SlideDeck slides={slides} />;
}
