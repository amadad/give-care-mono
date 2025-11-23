"use client";

import { SlideDeck } from "../../app/components/SlideDeck";
import Slide1 from "./slides/slide-1-title";
import Slide2 from "./slides/slide-2-question";
import Slide3 from "./slides/slide-3-what-is-caregiving";
import Slide4 from "./slides/slide-4-gendered-reality";
import Slide5 from "./slides/slide-5-crisis";
import Slide6 from "./slides/slide-6-sdoh";
import Slide8 from "./slides/slide-8-invisiblebench";
import Slide9 from "./slides/slide-9-invisiblebench-detail";
import Slide10 from "./slides/slide-10-transformation";
import Slide11 from "./slides/slide-11-call-to-action";
import Slide12 from "./slides/slide-12-thank-you";

export default function InvisibleCare() {
  const slides = [
    <Slide1 key={1} />,
    <Slide2 key={2} />,
    <Slide3 key={3} />,
    <Slide4 key={4} />,
    <Slide5 key={5} />,
    <Slide6 key={6} />,
    <Slide8 key={8} />,
    <Slide9 key={9} />,
    <Slide10 key={10} />,
    <Slide11 key={11} />,
    <Slide12 key={12} />,
  ];

  return <SlideDeck slides={slides} />;
}
