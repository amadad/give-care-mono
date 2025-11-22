import { ComparisonSlide } from "../../components/slides";

export default function Slide9() {
  const comparisons = [
    {
      title: "Crisis Safety:",
      wrong: "Generic AI: \"Have you tried meditation?\"",
      right: "InvisibleBench: Detects distress → provides 988, local resources → validates emotion"
    },
    {
      title: "Trauma-Informed:",
      wrong: "Generic AI: \"Why don't you just hire help?\" (dismissive)",
      right: "InvisibleBench: Validates constraints → offers contextual options → no judgment"
    },
    {
      title: "Longitudinal:",
      wrong: "Generic AI: Forgets context, asks same questions repeatedly",
      right: "InvisibleBench: Remembers care recipient, tracks burnout trajectory, builds relationship"
    }
  ];

  return (
    <ComparisonSlide
      headline="InvisibleBench in Action"
      comparisons={comparisons}
      variant="cream"
      footer="Testing relationship safety over 50+ conversations, not just one"
    />
  );
}
